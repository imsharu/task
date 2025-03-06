import pandas as pd

# List of parameter data for each device
data = [
    # Conveyor parameters
    {"Device": "Conveyor", "Parameter": "BeltSpeed", "Data Type": "float"},
    {"Device": "Conveyor", "Parameter": "LoadCapacity", "Data Type": "float"},
    {"Device": "Conveyor", "Parameter": "MotorPower", "Data Type": "float"},
    {"Device": "Conveyor", "Parameter": "ConveyorLength", "Data Type": "float"},
    {"Device": "Conveyor", "Parameter": "DriveVoltage", "Data Type": "int"},
    {"Device": "Conveyor", "Parameter": "OperatingTemperature", "Data Type": "float"},
    {"Device": "Conveyor", "Parameter": "BeltTension", "Data Type": "float"},
    {"Device": "Conveyor", "Parameter": "BeltWidth", "Data Type": "float"},
    {"Device": "Conveyor", "Parameter": "BeltThickness", "Data Type": "float"},
    {"Device": "Conveyor", "Parameter": "BeltMaterial", "Data Type": "string"},
    {"Device": "Conveyor", "Parameter": "MaintenanceInterval", "Data Type": "float"},
    
    # Pump parameters
    {"Device": "Pump", "Parameter": "FlowRate", "Data Type": "float"},
    {"Device": "Pump", "Parameter": "Head", "Data Type": "float"},
    {"Device": "Pump", "Parameter": "PowerConsumption", "Data Type": "float"},
    {"Device": "Pump", "Parameter": "Efficiency", "Data Type": "float"},
    {"Device": "Pump", "Parameter": "OperatingPressure", "Data Type": "float"},
    {"Device": "Pump", "Parameter": "SuctionLift", "Data Type": "float"},
    {"Device": "Pump", "Parameter": "MotorVoltage", "Data Type": "int"},
    {"Device": "Pump", "Parameter": "PumpType", "Data Type": "string"},
    {"Device": "Pump", "Parameter": "OperatingTemperature", "Data Type": "float"},
    {"Device": "Pump", "Parameter": "SealType", "Data Type": "string"},
    {"Device": "Pump", "Parameter": "Material", "Data Type": "string"},
    {"Device": "Pump", "Parameter": "ImpellerDiameter", "Data Type": "float"},
    {"Device": "Pump", "Parameter": "NPSH", "Data Type": "float"},
    {"Device": "Pump", "Parameter": "VibrationLevel", "Data Type": "float"},
    
    # Compressor parameters
    {"Device": "Compressor", "Parameter": "DischargePressure", "Data Type": "float"},
    {"Device": "Compressor", "Parameter": "Capacity", "Data Type": "float"},
    {"Device": "Compressor", "Parameter": "MotorPower", "Data Type": "float"},
    {"Device": "Compressor", "Parameter": "Efficiency", "Data Type": "float"},
    {"Device": "Compressor", "Parameter": "Speed", "Data Type": "int"},
    {"Device": "Compressor", "Parameter": "AirFlow", "Data Type": "float"},
    {"Device": "Compressor", "Parameter": "CoolingMethod", "Data Type": "string"},
    {"Device": "Compressor", "Parameter": "LubricationType", "Data Type": "string"},
    {"Device": "Compressor", "Parameter": "OperatingTemperature", "Data Type": "float"},
    {"Device": "Compressor", "Parameter": "PressureRatio", "Data Type": "float"},
    {"Device": "Compressor", "Parameter": "SoundLevel", "Data Type": "float"},
    {"Device": "Compressor", "Parameter": "Weight", "Data Type": "float"},
    {"Device": "Compressor", "Parameter": "OperatingVoltage", "Data Type": "int"},
    
    # IDFan parameters
    {"Device": "IDFan", "Parameter": "AirflowRate", "Data Type": "float"},
    {"Device": "IDFan", "Parameter": "PressureRise", "Data Type": "float"},
    {"Device": "IDFan", "Parameter": "MotorPower", "Data Type": "float"},
    {"Device": "IDFan", "Parameter": "FanSpeed", "Data Type": "int"},
    {"Device": "IDFan", "Parameter": "Efficiency", "Data Type": "float"},
    {"Device": "IDFan", "Parameter": "NoiseLevel", "Data Type": "float"},
    {"Device": "IDFan", "Parameter": "BladeDiameter", "Data Type": "float"},
    {"Device": "IDFan", "Parameter": "InletDiameter", "Data Type": "float"},
    {"Device": "IDFan", "Parameter": "OperatingTemperature", "Data Type": "float"},
    {"Device": "IDFan", "Parameter": "Vibration", "Data Type": "float"},
    {"Device": "IDFan", "Parameter": "DriveVoltage", "Data Type": "int"},
    {"Device": "IDFan", "Parameter": "FanType", "Data Type": "string"},
    
    # SkidPump parameters
    {"Device": "SkidPump", "Parameter": "FlowRate", "Data Type": "float"},
    {"Device": "SkidPump", "Parameter": "Head", "Data Type": "float"},
    {"Device": "SkidPump", "Parameter": "MotorPower", "Data Type": "float"},
    {"Device": "SkidPump", "Parameter": "Efficiency", "Data Type": "float"},
    {"Device": "SkidPump", "Parameter": "OperatingPressure", "Data Type": "float"},
    {"Device": "SkidPump", "Parameter": "Weight", "Data Type": "float"},
    {"Device": "SkidPump", "Parameter": "Dimensions", "Data Type": "string"},
    {"Device": "SkidPump", "Parameter": "SuctionLift", "Data Type": "float"},
    {"Device": "SkidPump", "Parameter": "PumpType", "Data Type": "string"},
    {"Device": "SkidPump", "Parameter": "MotorVoltage", "Data Type": "int"},
    {"Device": "SkidPump", "Parameter": "CoolingType", "Data Type": "string"},
    {"Device": "SkidPump", "Parameter": "Material", "Data Type": "string"},
    {"Device": "SkidPump", "Parameter": "TemperatureRating", "Data Type": "float"},
    
    # Transformer parameters
    {"Device": "Transformer", "Parameter": "RatedPower", "Data Type": "int"},
    {"Device": "Transformer", "Parameter": "PrimaryVoltage", "Data Type": "int"},
    {"Device": "Transformer", "Parameter": "SecondaryVoltage", "Data Type": "int"},
    {"Device": "Transformer", "Parameter": "Frequency", "Data Type": "float"},
    {"Device": "Transformer", "Parameter": "Efficiency", "Data Type": "float"},
    {"Device": "Transformer", "Parameter": "Impedance", "Data Type": "float"},
    {"Device": "Transformer", "Parameter": "TemperatureRise", "Data Type": "float"},
    {"Device": "Transformer", "Parameter": "CoolingType", "Data Type": "string"},
    {"Device": "Transformer", "Parameter": "TapChangerType", "Data Type": "string"},
    {"Device": "Transformer", "Parameter": "WindingConfiguration", "Data Type": "string"},
    {"Device": "Transformer", "Parameter": "VectorGroup", "Data Type": "string"},
    {"Device": "Transformer", "Parameter": "LoadLoss", "Data Type": "float"},
    {"Device": "Transformer", "Parameter": "NoLoadLoss", "Data Type": "float"},
    {"Device": "Transformer", "Parameter": "InsulationClass", "Data Type": "string"},
    {"Device": "Transformer", "Parameter": "Weight", "Data Type": "float"},
    {"Device": "Transformer", "Parameter": "Dimensions", "Data Type": "string"},
    {"Device": "Transformer", "Parameter": "NoiseLevel", "Data Type": "float"}
]

# Create DataFrame
df = pd.DataFrame(data)

# Save the DataFrame to an Excel file
df.to_excel("Industrial_Devices_Parameters.xlsx", index=False)

print("Excel file 'Industrial_Devices.xlsx' created successfully.")
