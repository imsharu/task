#!/usr/bin/env python3
import time
import threading
import csv
import os
import psutil
from datetime import datetime
from flask import Flask, render_template, jsonify
from opcua import Client, ua
import psycopg2

app = Flask(__name__)

# -------------------------------------------------------------------
# OPC UA and Polling Configuration
# -------------------------------------------------------------------
OPC_UA_URL = "opc.tcp://192.168.1.49:49320"  # Your Kepware OPC UA server endpoint

# List of tag NodeIds from your Kepware server (50+ tags)
TAG_NODEIDS = [ 
    "ns=2;s=Channel2.RX3i.A1", 
    "ns=2;s=Channel2.RX3i.A10",
    "ns=2;s=Channel2.RX3i.A100",
    "ns=2;s=Channel2.RX3i.A1000",
    "ns=2;s=Channel2.RX3i.A101",
    "ns=2;s=Channel2.RX3i.A102",
    "ns=2;s=Channel2.RX3i.A103",
    "ns=2;s=Channel2.RX3i.A104",
    "ns=2;s=Channel2.RX3i.A105",
    "ns=2;s=Channel2.RX3i.A106",
    "ns=2;s=Channel2.RX3i.A107",
    "ns=2;s=Channel2.RX3i.A108",
    "ns=2;s=Channel2.RX3i.A109",
    "ns=2;s=Channel2.RX3i.A11",
    "ns=2;s=Channel2.RX3i.A110",
    "ns=2;s=Channel2.RX3i.A111",
    "ns=2;s=Channel2.RX3i.A112",
    "ns=2;s=Channel2.RX3i.A113",
    "ns=2;s=Channel2.RX3i.A114",
    "ns=2;s=Channel2.RX3i.A115",
    "ns=2;s=Channel2.RX3i.A116",
    "ns=2;s=Channel2.RX3i.A117",
    "ns=2;s=Channel2.RX3i.A118",
    "ns=2;s=Channel2.RX3i.A119",
    "ns=2;s=Channel2.RX3i.A12",
    "ns=2;s=Channel2.RX3i.A120",
    "ns=2;s=Channel2.RX3i.A121",
    "ns=2;s=Channel2.RX3i.A122",
    "ns=2;s=Channel2.RX3i.A123",
    "ns=2;s=Channel2.RX3i.A124",
    "ns=2;s=Channel2.RX3i.A125",
    "ns=2;s=Channel2.RX3i.A126",
    "ns=2;s=Channel2.RX3i.A127",
    "ns=2;s=Channel2.RX3i.A128",
    "ns=2;s=Channel2.RX3i.A129",
    "ns=2;s=Channel2.RX3i.A13",
    "ns=2;s=Channel2.RX3i.A130",
    "ns=2;s=Channel2.RX3i.A131",
    "ns=2;s=Channel2.RX3i.A132",
    "ns=2;s=Channel2.RX3i.A133",
    "ns=2;s=Channel2.RX3i.A134",
    "ns=2;s=Channel2.RX3i.A135",
    "ns=2;s=Channel2.RX3i.A136",
    "ns=2;s=Channel2.RX3i.A137",
    "ns=2;s=Channel2.RX3i.A138",
    "ns=2;s=Channel2.RX3i.A139",
    "ns=2;s=Channel2.RX3i.A14",
    "ns=2;s=Channel2.RX3i.A140",
    "ns=2;s=Channel2.RX3i.A141",
    "ns=2;s=Channel2.RX3i.A142",
    "ns=2;s=Channel2.RX3i.A143",
    "ns=2;s=Channel2.RX3i.A144",
    "ns=2;s=Channel2.RX3i.A145",
    "ns=2;s=Channel2.RX3i.A146",
    "ns=2;s=Channel2.RX3i.A147",
    "ns=2;s=Channel2.RX3i.A148",
    "ns=2;s=Channel2.RX3i.A149",
    "ns=2;s=Channel2.RX3i.A15",
    "ns=2;s=Channel2.RX3i.A150",
    "ns=2;s=Channel2.RX3i.A151",
    "ns=2;s=Channel2.RX3i.A152",
    "ns=2;s=Channel2.RX3i.A153",
    "ns=2;s=Channel2.RX3i.A154",
    "ns=2;s=Channel2.RX3i.A155",
    "ns=2;s=Channel2.RX3i.A156",
    "ns=2;s=Channel2.RX3i.A157",
    "ns=2;s=Channel2.RX3i.A158",
    "ns=2;s=Channel2.RX3i.A159",
    "ns=2;s=Channel2.RX3i.A16",
    "ns=2;s=Channel2.RX3i.A160",
    "ns=2;s=Channel2.RX3i.A161",
    "ns=2;s=Channel2.RX3i.A162",
    "ns=2;s=Channel2.RX3i.A163",
    "ns=2;s=Channel2.RX3i.A164",
    "ns=2;s=Channel2.RX3i.A165",
    "ns=2;s=Channel2.RX3i.A166",
    "ns=2;s=Channel2.RX3i.A167",
    "ns=2;s=Channel2.RX3i.A168",
    "ns=2;s=Channel2.RX3i.A169",
    "ns=2;s=Channel2.RX3i.A17",
    "ns=2;s=Channel2.RX3i.A170",
    "ns=2;s=Channel2.RX3i.A171",
    "ns=2;s=Channel2.RX3i.A172",
    "ns=2;s=Channel2.RX3i.A173",
    "ns=2;s=Channel2.RX3i.A174",
    "ns=2;s=Channel2.RX3i.A175",
    "ns=2;s=Channel2.RX3i.A176",
    "ns=2;s=Channel2.RX3i.A177",
    "ns=2;s=Channel2.RX3i.A178",
    "ns=2;s=Channel2.RX3i.A179",
    "ns=2;s=Channel2.RX3i.A18",
    "ns=2;s=Channel2.RX3i.A180",
    "ns=2;s=Channel2.RX3i.A181",
    "ns=2;s=Channel2.RX3i.A182",
    "ns=2;s=Channel2.RX3i.A183",
    "ns=2;s=Channel2.RX3i.A184",
    "ns=2;s=Channel2.RX3i.A185",
    "ns=2;s=Channel2.RX3i.A186",
    "ns=2;s=Channel2.RX3i.A187",
    "ns=2;s=Channel2.RX3i.A188",
    "ns=2;s=Channel2.RX3i.A189",
    "ns=2;s=Channel2.RX3i.A19",
    "ns=2;s=Channel2.RX3i.A190",
    "ns=2;s=Channel2.RX3i.A191",
    "ns=2;s=Channel2.RX3i.A192",
    "ns=2;s=Channel2.RX3i.A193",
    "ns=2;s=Channel2.RX3i.A194",
    "ns=2;s=Channel2.RX3i.A195",
    "ns=2;s=Channel2.RX3i.A196",
    "ns=2;s=Channel2.RX3i.A197",
    "ns=2;s=Channel2.RX3i.A198",
    "ns=2;s=Channel2.RX3i.A199",
    "ns=2;s=Channel2.RX3i.A2",
    "ns=2;s=Channel2.RX3i.A20",
    "ns=2;s=Channel2.RX3i.A200",
    "ns=2;s=Channel2.RX3i.A201",
    "ns=2;s=Channel2.RX3i.A202",
    "ns=2;s=Channel2.RX3i.A203",
    "ns=2;s=Channel2.RX3i.A204",
    "ns=2;s=Channel2.RX3i.A205",
    "ns=2;s=Channel2.RX3i.A206",
    "ns=2;s=Channel2.RX3i.A207",
    "ns=2;s=Channel2.RX3i.A208",
    "ns=2;s=Channel2.RX3i.A209",
    "ns=2;s=Channel2.RX3i.A21",
    "ns=2;s=Channel2.RX3i.A210",
    "ns=2;s=Channel2.RX3i.A211",
    "ns=2;s=Channel2.RX3i.A212",
    "ns=2;s=Channel2.RX3i.A213",
    "ns=2;s=Channel2.RX3i.A214",
    "ns=2;s=Channel2.RX3i.A215",
    "ns=2;s=Channel2.RX3i.A216",
    "ns=2;s=Channel2.RX3i.A217",
    "ns=2;s=Channel2.RX3i.A218",
    "ns=2;s=Channel2.RX3i.A219",
    "ns=2;s=Channel2.RX3i.A22",
    "ns=2;s=Channel2.RX3i.A220",
    "ns=2;s=Channel2.RX3i.A221",
    "ns=2;s=Channel2.RX3i.A222",
    "ns=2;s=Channel2.RX3i.A223",
    "ns=2;s=Channel2.RX3i.A224",
    "ns=2;s=Channel2.RX3i.A225",
    "ns=2;s=Channel2.RX3i.A226",
    "ns=2;s=Channel2.RX3i.A227",
    "ns=2;s=Channel2.RX3i.A228",
    "ns=2;s=Channel2.RX3i.A229",
    "ns=2;s=Channel2.RX3i.A23",
    "ns=2;s=Channel2.RX3i.A230",
    "ns=2;s=Channel2.RX3i.A231",
    "ns=2;s=Channel2.RX3i.A232",
    "ns=2;s=Channel2.RX3i.A233",
    "ns=2;s=Channel2.RX3i.A234",
    "ns=2;s=Channel2.RX3i.A235",
    "ns=2;s=Channel2.RX3i.A236",
    "ns=2;s=Channel2.RX3i.A237",
    "ns=2;s=Channel2.RX3i.A238",
    "ns=2;s=Channel2.RX3i.A239",
    "ns=2;s=Channel2.RX3i.A24",
    "ns=2;s=Channel2.RX3i.A240",
    "ns=2;s=Channel2.RX3i.A241",
    "ns=2;s=Channel2.RX3i.A242",
    "ns=2;s=Channel2.RX3i.A243",
    "ns=2;s=Channel2.RX3i.A244",
    "ns=2;s=Channel2.RX3i.A245",
    "ns=2;s=Channel2.RX3i.A246",
    "ns=2;s=Channel2.RX3i.A247",
    "ns=2;s=Channel2.RX3i.A248",
    "ns=2;s=Channel2.RX3i.A249",
    "ns=2;s=Channel2.RX3i.A25",
    "ns=2;s=Channel2.RX3i.A250",
    "ns=2;s=Channel2.RX3i.A251",
    "ns=2;s=Channel2.RX3i.A252",
    "ns=2;s=Channel2.RX3i.A253",
    "ns=2;s=Channel2.RX3i.A254",
    "ns=2;s=Channel2.RX3i.A255",
    "ns=2;s=Channel2.RX3i.A256",
    "ns=2;s=Channel2.RX3i.A257",
    "ns=2;s=Channel2.RX3i.A258",
    "ns=2;s=Channel2.RX3i.A259",
    "ns=2;s=Channel2.RX3i.A26",
    "ns=2;s=Channel2.RX3i.A260",
    "ns=2;s=Channel2.RX3i.A261",
    "ns=2;s=Channel2.RX3i.A262",
    "ns=2;s=Channel2.RX3i.A263",
    "ns=2;s=Channel2.RX3i.A264",
    "ns=2;s=Channel2.RX3i.A265",
    "ns=2;s=Channel2.RX3i.A266",
    "ns=2;s=Channel2.RX3i.A267",
    "ns=2;s=Channel2.RX3i.A268",
    "ns=2;s=Channel2.RX3i.A269",
    "ns=2;s=Channel2.RX3i.A27",
    "ns=2;s=Channel2.RX3i.A270",
    "ns=2;s=Channel2.RX3i.A271",
    "ns=2;s=Channel2.RX3i.A272",
    "ns=2;s=Channel2.RX3i.A273",
    "ns=2;s=Channel2.RX3i.A274",
    "ns=2;s=Channel2.RX3i.A275",
    "ns=2;s=Channel2.RX3i.A276",
    "ns=2;s=Channel2.RX3i.A277",
    "ns=2;s=Channel2.RX3i.A278",
    "ns=2;s=Channel2.RX3i.A279",
    "ns=2;s=Channel2.RX3i.A28",
    "ns=2;s=Channel2.RX3i.A280"
]

# Polling interval (in seconds)
POLL_INTERVAL = 0.5
# Total runtime for polling (5 minutes = 300 seconds)
RUN_DURATION = 300

# CSV file for logging
CSV_FILE = "opc_log.csv"

# -------------------------------------------------------------------
# PostgreSQL Connection Parameters (remains the same)
# -------------------------------------------------------------------
PG_HOST = "localhost"
PG_PORT = 5432
PG_DATABASE = "opc-ua"
PG_USER = "postgres"
PG_PASSWORD = "post"

# -------------------------------------------------------------------
# Global variable to store current tag group data (list of tuples):
# Each tuple: (group_no, tag1_nodeid, tag1_name, tag1_value, tag1_scanrate,
#              tag2_nodeid, tag2_name, tag2_value, tag2_scanrate, ts, grp_scanrate, cpu_usage, mem_usage)
# -------------------------------------------------------------------
current_tag_data = []
# Global dictionary to store previous SourceTimestamp for each tag (if needed as fallback)
prev_tag_ts = {}

# -------------------------------------------------------------------
# Utility Functions
# -------------------------------------------------------------------
def extract_tag_name(node_id):
    """Extract a tag name from a NodeId string."""
    try:
        parts = node_id.split('.')
        if parts:
            last_part = parts[-1]
            if ';' in last_part:
                return last_part.split(';')[-1]
            return last_part
        return node_id
    except Exception:
        return node_id

def get_scan_rate(node):
    """
    Retrieve the Scan Rate (in ms) from the tag's properties.
    In Kepware the property is labeled "Scan Rate(ms)" under the General > Data Properties group.
    This function browses all properties and returns the value if found.
    """
    try:
        props = node.get_properties()
        for prop in props:
            if prop.get_browse_name().Name.lower() == "scan rate(ms)":
                return prop.get_value()
    except Exception as e:
        pass
    return None

def read_opcua_tags(client, node_ids, prev_ts):
    """
    Read tag values from the OPC UA server.
    For each tag, retrieve its value, its SourceTimestamp (as a string),
    and the server-provided Scan Rate(ms) property.
    Returns a list of tuples:
      (node_id, tag_name, tag_value, ts_str, tag_scan_rate)
    """
    values = []
    for node_id in node_ids:
        try:
            node = client.get_node(node_id)
            node_class = node.get_node_class()
            data_val = node.get_data_value()
            val = data_val.Value.Value
            ts = data_val.SourceTimestamp
            if ts is None:
                ts = datetime.now()
            ts_str = ts.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
            tag_scan_rate = get_scan_rate(node)
            values.append((node_id, extract_tag_name(node_id), str(val), ts_str, tag_scan_rate))
        except Exception as e:
            print(f"Error reading node {node_id}: {e}")
            values.append((node_id, extract_tag_name(node_id), None, None, None))
    return values

def print_table(grouped_data):
    """
    Print grouped tag data in a formatted table with columns:
    Grp, Tag1 NodeId, Tag1 Name, Tag1 Value, Tag1 SR,
    Tag2 NodeId, Tag2 Name, Tag2 Value, Tag2 SR,
    Timestamp, Grp SR, CPU (%), Mem (%)
    """
    header = (f"{'Grp':<4} | {'Tag1 NodeId':<45} | {'Tag1 Name':<10} | {'Tag1 Value':<15} | {'Tag1 SR':<10} | "
              f"{'Tag2 NodeId':<45} | {'Tag2 Name':<10} | {'Tag2 Value':<15} | {'Tag2 SR':<10} | "
              f"{'Timestamp':<23} | {'Grp SR':<8} | {'CPU (%)':<8} | {'Mem (%)':<8}")
    separator = "-" * len(header)
    print(separator)
    print(header)
    print(separator)
    for group in grouped_data:
        try:
            (grp_no, t1_nodeid, t1_name, t1_value, t1_sr,
             t2_nodeid, t2_name, t2_value, t2_sr, ts, grp_sr, cpu_usage, mem_usage) = group
            print(f"{grp_no:<4} | {t1_nodeid:<45} | {t1_name:<10} | {str(t1_value):<15} | {str(t1_sr):<10} | "
                  f"{t2_nodeid:<45} | {t2_name:<10} | {str(t2_value):<15} | {str(t2_sr):<10} | "
                  f"{ts:<23} | {grp_sr:<8} | {cpu_usage:<8} | {mem_usage:<8}")
        except Exception as e:
            print("Error printing group:", e)
    print(separator)

def log_to_csv(csv_file, grouped_data):
    """
    Append grouped tag data to a CSV file.
    The CSV file will have columns:
    Group, Tag1 NodeId, Tag1 Name, Tag1 Value, Tag1 SR,
    Tag2 NodeId, Tag2 Name, Tag2 Value, Tag2 SR, Timestamp,
    Grp SR, CPU (%), Memory (%)
    """
    file_exists = os.path.isfile(csv_file)
    with open(csv_file, mode="a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["Group", "Tag1 NodeId", "Tag1 Name", "Tag1 Value", "Tag1 SR",
                             "Tag2 NodeId", "Tag2 Name", "Tag2 Value", "Tag2 SR", "Timestamp",
                             "Grp SR", "CPU (%)", "Memory (%)"])
        for group in grouped_data:
            writer.writerow(list(group))

def insert_into_db(conn, grouped_data):
    """
    Insert grouped tag data into the opc_data_group1 table.
    Each row: (group_no, tag1_nodeid, tag1_name, tag1_value, tag1_scanrate,
               tag2_nodeid, tag2_name, tag2_value, tag2_scanrate, ts, grp_scanrate, cpu_usage, mem_usage)
    """
    with conn.cursor() as cur:
        for group in grouped_data:
            cur.execute(
                "INSERT INTO opc_data_group1 (group_no, tag1_nodeid, tag1_name, tag1_value, tag1_scanrate, "
                "tag2_nodeid, tag2_name, tag2_value, tag2_scanrate, ts, grp_scanrate, cpu_usage, mem_usage) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                group
            )
    conn.commit()

# -------------------------------------------------------------------
# Background Polling Function
# -------------------------------------------------------------------
def background_polling():
    """
    Connect to the OPC UA server and poll tag values every POLL_INTERVAL seconds for RUN_DURATION seconds.
    For each poll:
      - Read all tag values and retrieve the server-provided Scan Rate(ms) property.
      - Group tags into pairs (without performing any computation on scan rate).
      - Set the group scan rate to "N/A".
      - Retrieve system performance (CPU and memory usage).
      - Record a common timestamp.
      - Update global current_tag_data, print a formatted table,
        log to CSV, and insert into PostgreSQL.
    """
    global current_tag_data
    client = Client(OPC_UA_URL)
    try:
        client.connect()
        print("Connected to OPC UA server (background thread).")
    except Exception as e:
        print("Could not connect to OPC UA server:", e)
        return

    try:
        conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            database=PG_DATABASE,
            user=PG_USER,
            password=PG_PASSWORD
        )
        print("Connected to PostgreSQL (background thread).")
    except Exception as e:
        print("Could not connect to PostgreSQL:", e)
        client.disconnect()
        return

    start_time = time.time()
    while time.time() - start_time < RUN_DURATION:
        # Get a common timestamp for this poll
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        # Read raw tag data with server-provided Scan Rate(ms)
        raw_data = read_opcua_tags(client, TAG_NODEIDS, prev_tag_ts)
        # Group raw data into pairs; do not compute a new scan rate.
        groups = []
        group_num = 1
        for i in range(0, len(raw_data), 2):
            if i+1 < len(raw_data):
                t1 = raw_data[i]   # (node_id, tag_name, tag_value, ts_str, tag_scan_rate)
                t2 = raw_data[i+1]
            else:
                t1 = raw_data[i]
                t2 = ("", "", "", "", 0.0)
            # Set group scan rate to a placeholder (since no computation is required)
            grp_sr = "N/A"
            # Retrieve system performance metrics
            cpu_usage = psutil.cpu_percent(interval=None)
            mem_usage = psutil.virtual_memory().percent
            groups.append((group_num, t1[0], t1[1], t1[2], t1[4],
                           t2[0], t2[1], t2[2], t2[4],
                           ts, grp_sr, cpu_usage, mem_usage))
            group_num += 1

        current_tag_data = groups
        print_table(groups)
        log_to_csv(CSV_FILE, groups)
        insert_into_db(conn, groups)
        time.sleep(POLL_INTERVAL)
    client.disconnect()
    conn.close()
    print("Background polling finished after 5 minutes.")

# -------------------------------------------------------------------
# Flask Endpoints
# -------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/tag-values", methods=["GET"])
def api_tag_values():
    return jsonify(current_tag_data)

# -------------------------------------------------------------------
# Main: Start background polling thread and run Flask app
# -------------------------------------------------------------------
if __name__ == "__main__":
    # Global dictionary to store previous SourceTimestamp for each tag (not used for scan rate now)
    prev_tag_ts = {}
    polling_thread = threading.Thread(target=background_polling, daemon=True)
    polling_thread.start()
    app.run(debug=True)
