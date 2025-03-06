import time
import threading
import psutil
import psycopg2
from datetime import datetime
from flask import Flask, render_template, jsonify
from opcua import Client

app = Flask(__name__)

# TimescaleDB Connection Configuration
TSDB_HOST = "localhost"
TSDB_PORT = 5432
TSDB_DATABASE = "opc_data"
TSDB_USER = "postgres"
TSDB_PASSWORD = "post"  # Set your TimescaleDB password here

# OPC UA Connection Configuration
OPC_UA_URL = "opc.tcp://192.168.1.49:49320"  # Your OPC UA server URL
TAG_NODEIDS = [
    "ns=2;s=Channel3.Versamax.A1",
    "ns=2;s=Channel3.Versamax.A10",
    "ns=2;s=Channel3.Versamax.A100",
    "ns=2;s=Channel3.Versamax.A11",
    "ns=2;s=Channel3.Versamax.A12",
    "ns=2;s=Channel3.Versamax.A13",
    "ns=2;s=Channel3.Versamax.A14",
    "ns=2;s=Channel3.Versamax.A15",
    "ns=2;s=Channel3.Versamax.A16",
    "ns=2;s=Channel3.Versamax.A17",
    "ns=2;s=Channel3.Versamax.A18",
    "ns=2;s=Channel3.Versamax.A19",
    "ns=2;s=Channel3.Versamax.A2",
    "ns=2;s=Channel3.Versamax.A20",
    "ns=2;s=Channel3.Versamax.A21",
    "ns=2;s=Channel3.Versamax.A22",
    "ns=2;s=Channel3.Versamax.A23",
    "ns=2;s=Channel3.Versamax.A24",
    "ns=2;s=Channel3.Versamax.A25",
    "ns=2;s=Channel3.Versamax.A26",
    "ns=2;s=Channel3.Versamax.A27",
    "ns=2;s=Channel3.Versamax.A28",
    "ns=2;s=Channel3.Versamax.A29",
    "ns=2;s=Channel3.Versamax.A3",
    "ns=2;s=Channel3.Versamax.A30",
    "ns=2;s=Channel3.Versamax.A31",
    "ns=2;s=Channel3.Versamax.A32",
    "ns=2;s=Channel3.Versamax.A33",
    "ns=2;s=Channel3.Versamax.A34",
    "ns=2;s=Channel3.Versamax.A35",
    "ns=2;s=Channel3.Versamax.A36",
    "ns=2;s=Channel3.Versamax.A37",
    "ns=2;s=Channel3.Versamax.A38",
    "ns=2;s=Channel3.Versamax.A39",
    "ns=2;s=Channel3.Versamax.A4",
    "ns=2;s=Channel3.Versamax.A40",
    "ns=2;s=Channel3.Versamax.A41",
    "ns=2;s=Channel3.Versamax.A42",
    "ns=2;s=Channel3.Versamax.A43",
    "ns=2;s=Channel3.Versamax.A44",
    "ns=2;s=Channel3.Versamax.A45",
    "ns=2;s=Channel3.Versamax.A46",
    "ns=2;s=Channel3.Versamax.A47",
    "ns=2;s=Channel3.Versamax.A48",
    "ns=2;s=Channel3.Versamax.A49",
    "ns=2;s=Channel3.Versamax.A5",
    "ns=2;s=Channel3.Versamax.A50"
]

# Global variable to store the latest tag values.
# Each entry is a tuple: (tag_id, value, timestamp)
current_tag_data = []

def get_opcua_values(client, node_ids):
    """
    Retrieve values from the OPC UA server for each node in node_ids.
    Returns a list of tuples (tag_id, value).
    """
    tag_values = []
    for node_id in node_ids:
        try:
            node = client.get_node(node_id)
            value = node.get_value()
            tag_values.append((node_id, value))
        except Exception as e:
            print(f"Error reading node {node_id}: {e}")
            tag_values.append((node_id, None))
    return tag_values

def insert_into_db(conn, tag_data):
    """
    Insert the tag data into TimescaleDB.
    Each record includes tag_id, value, and a timestamp.
    """
    with conn.cursor() as cursor:
        for tag_id, value, ts in tag_data:
            cursor.execute("""
                INSERT INTO tag_data (tag_id, value, timestamp)
                VALUES (%s, %s, %s)
            """, (tag_id, value, ts))
        conn.commit()

def log_system_metrics():
    """
    Every 10 seconds, log system metrics (CPU and Memory usage) along with:
    - The start time (captured before fetching metrics)
    - The end time (after fetching)
    - The execution time (difference between end and start)
    And also log the current tag data.
    """
    while True:
        start_time = datetime.now()  # Capture start time
        cpu_usage = psutil.cpu_percent(interval=None)
        mem_usage = psutil.virtual_memory().percent
        end_time = datetime.now()  # Capture end time after fetching metrics
        exec_time = end_time - start_time

        with open('system_metrics1.log', 'a') as log_file:
            log_file.write(
                f"Start Time: {start_time.strftime('%Y-%m-%d %H:%M:%S.%f')} | "
                f"End Time: {end_time.strftime('%Y-%m-%d %H:%M:%S.%f')} | "
                f"Execution Time: {str(exec_time)} | "
                f"CPU Usage: {cpu_usage}% | Memory Usage: {mem_usage}%\n"
            )
            for tag_id, value, ts in current_tag_data:
                log_file.write(f"Tag ID: {tag_id}, Value: {value}, Timestamp: {ts}\n")
            log_file.write("\n")
        time.sleep(10)

def background_polling():
    """
    Connect to the OPC UA server and TimescaleDB.
    Poll OPC UA tags every 500ms, update the global tag data (with a timestamp),
    and insert the data into TimescaleDB.
    """
    global current_tag_data
    client = Client(OPC_UA_URL)
    try:
        client.connect()
        print("Connected to OPC UA server")
    except Exception as e:
        print(f"Error connecting to OPC UA server: {e}")
        return

    try:
        conn = psycopg2.connect(
            host=TSDB_HOST, port=TSDB_PORT, database=TSDB_DATABASE,
            user=TSDB_USER, password=TSDB_PASSWORD)
        print("Connected to TimescaleDB")
    except Exception as e:
        print(f"Error connecting to TimescaleDB: {e}")
        return

    while True:
        # Retrieve tag values from OPC UA
        tag_values = get_opcua_values(client, TAG_NODEIDS)
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
        # Append the timestamp to each tag value for display and DB insertion
        tag_data_with_ts = [(tag_id, value, current_time) for tag_id, value in tag_values]
        current_tag_data = tag_data_with_ts  # Update the global variable
        insert_into_db(conn, tag_data_with_ts)
        time.sleep(0.5)
        
    client.disconnect()
    conn.close()

@app.route('/')
def index():
    """Render the main HTML page."""
    return render_template('index_5.html')

@app.route('/api/tag-values', methods=['GET'])
def api_tag_values():
    """Return the current tag data (with timestamps) as JSON."""
    return jsonify(current_tag_data)

if __name__ == '__main__':
    # Start background polling (OPC UA and DB insertion)
    threading.Thread(target=background_polling, daemon=True).start()
    # Start system metrics logging
    threading.Thread(target=log_system_metrics, daemon=True).start()
    # Start the Flask web server
    app.run(debug=True, host='0.0.0.0', port=5000)
