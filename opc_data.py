import time
import threading
import psutil
import pyodbc
from datetime import datetime
from flask import Flask, render_template, jsonify
from opcua import Client
from concurrent.futures import ThreadPoolExecutor, as_completed

app = Flask(__name__)

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

# Microsoft SQL Server Connection Configuration
SQL_SERVER = "DESKTOP-0JFUA72\\MSSQLSERVER01"
SQL_DATABASE = "OPC_UA"
SQL_USER = "sharath"
SQL_PASSWORD = "154321098"
SQL_DRIVER = "ODBC Driver 17 for SQL Server"
SQL_CONNECTION_STRING = f"DRIVER={{{SQL_DRIVER}}};SERVER={SQL_SERVER};DATABASE={SQL_DATABASE};UID={SQL_USER};PWD={SQL_PASSWORD}"

# System Metrics Log Interval (10 seconds)
LOG_INTERVAL = 10

# Global variable to store the latest tag values
current_tag_data = []

def get_value_for_node(client, node_id):
    try:
        node = client.get_node(node_id)
        value = node.get_value()
        return (node_id, value)
    except Exception as e:
        print(f"Error reading node {node_id}: {e}")
        return (node_id, None)

def get_opcua_values(client, node_ids):
    """Retrieve values concurrently for the given node IDs from the OPC UA server."""
    tag_values = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(get_value_for_node, client, node_id): node_id for node_id in node_ids}
        for future in as_completed(futures):
            tag_values.append(future.result())
    return tag_values

def log_system_metrics():
    """Log system metrics (CPU, Memory) along with execution time every 10 seconds."""
    with open('system_metrics.log', 'a') as log_file:
        while True:
            start_time = datetime.now()
            cpu_usage = psutil.cpu_percent(interval=None)
            mem_usage = psutil.virtual_memory().percent
            end_time = datetime.now()
            exec_time = end_time - start_time
            log_file.write(
                f"Start Time: {start_time.strftime('%Y-%m-%d %H:%M:%S.%f')} | "
                f"End Time: {end_time.strftime('%Y-%m-%d %H:%M:%S.%f')} | "
                f"Execution Time: {str(exec_time)} | "
                f"CPU Usage: {cpu_usage}% | Memory Usage: {mem_usage}%\n"
            )
            log_file.flush()
            time.sleep(LOG_INTERVAL)

def insert_into_db(conn, tag_data):
    """Insert the retrieved tag data into the SQL Server database."""
    try:
        with conn.cursor() as cursor:
            for tag_id, value in tag_data:
                cursor.execute("""
                    INSERT INTO tag_data (tag_id, value, timestamp)
                    VALUES (?, ?, ?)
                """, (tag_id, value, datetime.now()))
            conn.commit()
    except Exception as e:
        print(f"Error inserting data into database: {e}")

def background_polling():
    """
    Poll OPC-UA tags concurrently, update the global variable with the latest values,
    and insert these values into the database every 500ms.
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
        conn = pyodbc.connect(SQL_CONNECTION_STRING)
        print("Connected to Microsoft SQL Server")
    except Exception as e:
        print(f"Error connecting to SQL Server: {e}")
        return

    while True:
        tag_data = get_opcua_values(client, TAG_NODEIDS)
        current_tag_data = tag_data  # update global variable for the API
        insert_into_db(conn, tag_data)
        time.sleep(0.5)
        
    client.disconnect()
    conn.close()

@app.route('/')
def index():
    """Render the HTML page."""
    return render_template('index4.html')

@app.route('/api/tag-values', methods=['GET'])
def api_tag_values():
    """Return the latest tag values as JSON."""
    return jsonify(current_tag_data)

if __name__ == '__main__':
    # Start the background threads
    threading.Thread(target=background_polling, daemon=True).start()
    threading.Thread(target=log_system_metrics, daemon=True).start()
    app.run(debug=True, host='0.0.0.0', port=5000)
