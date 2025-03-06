def list_properties(node):
    """
    List all properties for the given node, and print the property names and values.
    """
    try:
        # Print all children to see if scan rate is part of any child nodes
        children = node.get_children()
        for child in children:
            print(f"Child Node: {child.get_browse_name().Name}, NodeId: {child.nodeid.to_string()}")

        # Attempt to fetch all properties directly
        properties = node.get_properties()
        if properties:
            for prop in properties:
                prop_name = prop.get_browse_name().Name
                prop_value = prop.get_value()
                print(f"Property: {prop_name} => Value: {prop_value}")
        else:
            print("No properties found for this node.")
    except Exception as e:
        print(f"Error listing properties for node {node.nodeid.to_string()}: {e}")

def get_scan_rate_from_known_path(node):
    """
    Try to retrieve the Scan Rate from a known path if available.
    This might work if Scan Rate is exposed directly under a known property.
    """
    try:
        # Example of scanning for scan rate directly
        scan_rate_node = node.get_child("2:Scan Rate")  # Adjust this path if needed
        scan_rate_value = scan_rate_node.get_value()
        print(f"Scan Rate found: {scan_rate_value}")
        return scan_rate_value
    except Exception as e:
        print(f"Could not find scan rate in the expected path: {e}")
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
        scan_rate = get_scan_rate_from_known_path(node)
        return (node_id, value, scan_rate)
    except Exception as e:
        print(f"Error reading node {node_id}: {e}")
        return (node_id, None, None)

def list_all_children(node):
    """
    List and print all children of the given node.
    """
    try:
        children = node.get_children()
        for child in children:
            print(f"Child: {child.get_browse_name().Name} | NodeId: {child.nodeid.to_string()}")
    except Exception as e:
        print(f"Error browsing children: {e}")

# Example usage:
if __name__ == "__main__":
    from opcua import Client
    client = Client("opc.tcp://127.0.0.1:49320")
    client.connect()
    node = client.get_node("ns=2;s=Stroi.WaterLevel.Level")
    list_all_children(node)  # This will print the children of the node

    tag_info = read_opcua_tag(client, "ns=2;s=Stroi.WaterLevel.Level")
    print("Tag info:", tag_info)
    client.disconnect()
