#!/usr/bin/env python3
from opcua import Client

def browse_nodes(node, indent=""):
    """
    Recursively browses the node's children and prints the browse name
    along with its NodeId.
    """
    try:
        children = node.get_children()
        for child in children:
            try:
                # Get the node's browse name and NodeId as a string
                browse_name = child.get_browse_name().Name
                node_id = child.nodeid.to_string()
                print(f"{indent}{browse_name} - {node_id}")
            except Exception as e:
                print(f"{indent}Error reading node info: {e}")
            # Recursively browse the child's children
            browse_nodes(child, indent + "  ")
    except Exception as e:
        print(f"{indent}Error browsing children: {e}")

def main():
    # Replace with your actual OPC UA server endpoint
    opcua_url = "opc.tcp://127.0.0.1:49320"
    client = Client(opcua_url)
    try:
        client.connect()
        print(f"Connected to OPC UA server at {opcua_url}")
        
        # Get the root Objects node (commonly where your channels are located)
        objects_node = client.get_objects_node()
        print("Browsing OPC UA Address Space:")
        browse_nodes(objects_node)
    except Exception as e:
        print("Error:", e)
    finally:
        client.disconnect()
        print("Disconnected from OPC UA server.")

if __name__ == "__main__":
    main()
