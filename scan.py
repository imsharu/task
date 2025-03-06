#!/usr/bin/env python3
from opcua import Client, ua
from datetime import datetime

def list_properties(node):
    """
    List and print all property BrowseNames and their values for the given node.
    """
    try:

        children = node.get_children()
        for child in children:
            print(f"Child: {child.get_browse_name().Name} | NodeId: {child.nodeid.to_string()}")
        properties = node.get_properties()
        print("Listing properties for node", node.nodeid.to_string())
        for prop in properties:
            try:
                prop_name = prop.get_browse_name().Name
                prop_value = prop.get_value()
                print(f"Property: '{prop_name}' => Value: {prop_value}")
            except Exception as inner_e:
                print(f"Property retrieval error: {inner_e}")
    except Exception as e:
        print(f"Error listing properties for node {node.nodeid.to_string()}: {e}")

def get_scan_rate(node):
    """
    Retrieve the Scan Rate (in ms) from the tag's properties.
    This function browses all properties of the node and returns the value of the property 
    whose BrowseName (case-insensitive) matches the expected string.
    In Kepware, this value is shown in the Property Editor under General > Data Properties.
    """
    try:
        properties = node.get_properties()
        print("properties :",properties)
        for prop in properties:
            prop_name = prop.get_browse_name().Name.lower().strip()
            print("prop_name :",prop_name)
            # Check for variations in the property name
            if prop_name in ["scan rate(ms)", "scan rate (ms)"]:
                return prop.get_value()
    except Exception as e:
        print(f"Error retrieving scan rate: {e}")
    return None

def read_opcua_tag(client, node_id):
    """
    Retrieve the tag's value and its scan rate property.
    """
    try:
        node = client.get_node(node_id)
        # List all properties to help identify the correct property name.
        list_properties(node)
        value = node.get_value()
        scan_rate = get_scan_rate(node)
        return (node_id, value, scan_rate)
    except Exception as e:
        print(f"Error reading node {node_id}: {e}")
        return (node_id, None, None)

if __name__ == "__main__":
    # Replace with your OPC UA server endpoint and a valid NodeId from your Kepware server.
    client = Client("opc.tcp://192.168.1.49:49320")
    try:
        client.connect()
        print("Connected to OPC UA server.")
        # Example NodeId; update to one of your tags.
        node_id = "ns=2;s=Channel2.RX3i.A275"
        tag_info = read_opcua_tag(client, node_id)
        print("Tag info:", tag_info)
    finally:
        client.disconnect()
