from opcua import Client, ua

client = Client("opc.tcp://127.0.0.1:49320")  # Replace with your OPC UA server address
client.connect()

# Specify the tag/node ID
node = client.get_node("ns=2;s=Stroi.Room.R4L1")  # Replace with your tag

# Get the data type
data_type = node.get_data_type_as_variant_type()
print(f"Data Type: {data_type}")