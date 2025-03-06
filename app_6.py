from flask import Flask, render_template, request, jsonify
from opcua import Client, ua
import operator
import functools

app = Flask(__name__)

# Use a persistent OPC-UA client to avoid repeated connection overhead.
global_client = None
def get_client():
    global global_client
    if global_client is None:
        global_client = Client("opc.tcp://127.0.0.1:49320")
        # Remove set_security() call since no security is required.
        global_client.connect()
    return global_client

# Logical operations
logical_operations = {
    'AND': lambda a, b: a and b,
    'OR': lambda a, b: a or b,
    'NOT': lambda a: not a,
    'GreaterThan': lambda a, b: a > b,
    'LessThan': lambda a, b: a < b
}

# Mathematical operations
math_operations = {
    'ADD': lambda *args: sum(args),
    'SUBTRACT': lambda *args: args[0] - sum(args[1:]),
    'MULTIPLY': lambda *args: functools.reduce(operator.mul, args, 1),
    'DIVIDE': lambda a, b: operator.truediv(a, b) if b != 0 else None
}

def parse_opcua_node(node):
    """
    Recursively parse a node to build a nested dictionary with:
      - "_tags": { tagName: {nodeId, tagType}, ... } for leaf nodes.
      - "_groups": { groupName: parsed group, ... } for nodes with children.
    
    For each tag we use get_data_type_as_variant_type() to obtain its variant type.
    If the variant type equals ua.VariantType.Boolean then we set tagType to "boolean",
    otherwise we set it to "analog".
    """
    result = {"_tags": {}, "_groups": {}}
    for child in node.get_children():
        child_name = child.get_browse_name().Name
        grandchildren = child.get_children()
        if not grandchildren:
            try:
                variant_type = child.get_data_type_as_variant_type()
                print(f"DEBUG: Tag '{child_name}', NodeID={child.nodeid.to_string()}, VariantType={variant_type}")
                if variant_type == ua.VariantType.Boolean:
                    tag_type = "boolean"
                else:
                    tag_type = "analog"
            except Exception as ex:
                print(f"DEBUG: Error getting variant type for '{child_name}': {ex}")
                tag_type = "analog"
            result["_tags"][child_name] = {
                "nodeId": child.nodeid.to_string(),
                "tagType": tag_type
            }
        else:
            result["_groups"][child_name] = parse_opcua_node(child)
    return result

def fetch_structure(client_url):
    """
    Connect to the OPC-UA server and return a dictionary for the "stroi" channel only.
    """
    structure = {}
    try:
        client = get_client()
        for channel in client.get_objects_node().get_children():
            channel_name = channel.get_browse_name().Name
            if channel_name.lower() != "stroi":
                continue
            structure[channel_name] = parse_opcua_node(channel)
            break
    except Exception as e:
        print(f"Error fetching OPC UA structure: {e}")
    return structure

@app.route('/')
def index():
    return render_template('index_6.html')

@app.route('/api/get-opcua-structure', methods=['GET'])
def get_opcua_structure():
    opcua_structure = fetch_structure("opc.tcp://127.0.0.1:49320")
    return jsonify(opcua_structure)

def fetch_tag_value(client_url, node_id):
    try:
        client = get_client()
        value = client.get_node(node_id).get_value()
        return value
    except Exception as e:
        print(f"Error fetching tag value: {e}")
        return None

@app.route('/api/get-tag-value', methods=['POST'])
def get_tag_value():
    data = request.json
    value = fetch_tag_value("opc.tcp://127.0.0.1:49320", data.get('node_id'))
    if value is not None:
        return jsonify({"value": value})
    else:
        return jsonify({"error": "Failed to fetch tag value"}), 500

@app.route('/evaluate_logic', methods=['POST'])
def evaluate_logic():
    data = request.json
    operation = data['operation']
    inputs = data['inputs']
    if operation == 'NOT':
        if len(inputs) != 1:
            return jsonify({'error': 'NOT requires 1 input'}), 400
        result = logical_operations[operation](inputs[0])
    else:
        if len(inputs) != 2:
            return jsonify({'error': f'{operation} requires 2 inputs.'}), 400
        result = logical_operations[operation](inputs[0], inputs[1])
    return jsonify({'result': result})

@app.route('/evaluate_math', methods=['POST'])
def evaluate_math():
    data = request.json
    operation = data['operation']
    inputs = data['inputs']
    expected = 2 if operation in ['SUBTRACT', 'DIVIDE'] else len(inputs)
    if len(inputs) < expected:
        return jsonify({'error': f'{operation} requires at least {expected} inputs.'}), 400
    try:
        if operation in math_operations:
            result = math_operations[operation](*inputs)
        else:
            result = None
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/favicon.ico')
def favicon():
    return '', 204

if __name__ == '__main__':
    app.run(debug=True)
