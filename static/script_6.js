/*********************************************************
 *  GLOBAL DATA
 *********************************************************/
let boxIdCounter = 1;
let boxes = []; // Array holding all operation boxes
let connections = []; // Array of connections { fromBoxId, toBoxId, toInputIndex }
let pollingIntervalId = null; // For updating operation box tag values

// Variables for repositioning and resizing
let currentDragBox = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let currentResizeBox = null;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let resizeStartX = 0;
let resizeStartY = 0;

/*********************************************************
 *  ICON MAPPINGS FOR OPERATIONS
 *********************************************************/
const logicalIcons = {
  "AND": "/static/icons/and.png",
  "OR": "/static/icons/or.png",
  "NOT": "/static/icons/not.png",
  "NAND": "/static/icons/nand.png",
  "XOR": "/static/icons/xor.png",
  "NOR": "/static/icons/nor.png",
  "XNOR": "/static/icons/xnor.png",
  "TIMER": "/static/icons/timer.png"
};

const mathIcons = {
  "ADDITION": "/static/icons/add.png",
  "SUBTRACTION": "/static/icons/subtract.png",
  "MULTIPLICATION": "/static/icons/multiply.png",
  "DIVISION": "/static/icons/divide.png",
  "AVERAGE": "/static/icons/average.png"
};

const comparisonIcons = {
  "GREATER THAN": "/static/icons/greater.png",
  "LESSER THAN": "/static/icons/less.png",
  "EQUAL TO": "/static/icons/equal.png"
};

const otherIcons = {
  "COUNTER": "/static/icons/counter.png"
};

/*********************************************************
 *  HELPER: Get Operation Group by Name
 *********************************************************/
function getOperationGroup(opName) {
  const logicalOps = ["AND", "OR", "NOT", "NAND", "XOR", "NOR", "XNOR", "TIMER"];
  const mathOps = ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "AVERAGE"];
  const compOps = ["GREATER THAN", "LESSER THAN", "EQUAL TO"];
  const otherOps = ["COUNTER"];
  if (logicalOps.includes(opName)) return "logical";
  if (mathOps.includes(opName)) return "math";
  if (compOps.includes(opName)) return "comparison";
  if (otherOps.includes(opName)) return "other";
  return "";
}

/*********************************************************
 *  HELPER: Default Logical Value for Missing Inputs
 *********************************************************/
function getDefaultLogicalValue(opName) {
  // For AND, NAND, XNOR, TIMER: default to true; for OR, NOR, XOR: default to false; for NOT: false.
  if (["AND", "NAND", "XNOR", "TIMER"].includes(opName)) return true;
  if (["OR", "NOR", "XOR"].includes(opName)) return false;
  if (opName === "NOT") return false;
  return false;
}

/*********************************************************
 *  SIDEBAR CREATION
 *********************************************************/
function createCollapsibleItem(name) {
  const li = document.createElement('li');
  li.classList.add('collapsible');
  const span = document.createElement('span');
  span.textContent = name;
  li.appendChild(span);
  const nestedUl = document.createElement('ul');
  nestedUl.classList.add('nested');
  li.appendChild(nestedUl);
  span.addEventListener('click', (e) => {
    e.stopPropagation();
    li.classList.toggle('active');
  });
  return [li, nestedUl];
}

function renderLogicalOperations(parentUl) {
  const [li, nestedUl] = createCollapsibleItem("Logical Operations");
  const ops = ["AND", "OR", "NOT", "NAND", "XOR", "NOR", "XNOR", "TIMER"];
  ops.forEach(op => {
    const opLi = document.createElement('li');
    opLi.classList.add('draggable');
    opLi.innerHTML = `<img src="${logicalIcons[op]}" class="operation-icon" width="24" height="24" alt="${op}">`;
    opLi.dataset.type = 'logicalOperation';
    opLi.dataset.value = op;
    opLi.draggable = true;
    opLi.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'logicalOperation',
        value: op
      }));
    });
    nestedUl.appendChild(opLi);
  });
  parentUl.appendChild(li);
}

function renderMathOperations(parentUl) {
  const [li, nestedUl] = createCollapsibleItem("Mathematical Operations");
  const ops = ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "AVERAGE"];
  ops.forEach(op => {
    const opLi = document.createElement('li');
    opLi.classList.add('draggable');
    opLi.innerHTML = `<img src="${mathIcons[op]}" class="operation-icon" width="24" height="24" alt="${op}">`;
    opLi.dataset.type = 'operation';
    opLi.dataset.value = op;
    opLi.draggable = true;
    opLi.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'operation',
        value: op
      }));
    });
    nestedUl.appendChild(opLi);
  });
  parentUl.appendChild(li);
}

function renderComparisonOperations(parentUl) {
  const [li, nestedUl] = createCollapsibleItem("Comparison Operations");
  const ops = ["GREATER THAN", "LESSER THAN", "EQUAL TO"];
  ops.forEach(op => {
    const opLi = document.createElement('li');
    opLi.classList.add('draggable');
    opLi.innerHTML = `<img src="${comparisonIcons[op]}" class="operation-icon" width="24" height="24" alt="${op}">`;
    opLi.dataset.type = 'comparison';
    opLi.dataset.value = op;
    opLi.draggable = true;
    opLi.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'comparison',
        value: op
      }));
    });
    nestedUl.appendChild(opLi);
  });
  parentUl.appendChild(li);
}

function renderOtherOperations(parentUl) {
  const [li, nestedUl] = createCollapsibleItem("Other Operations");
  const ops = ["COUNTER"];
  ops.forEach(op => {
    const opLi = document.createElement('li');
    opLi.classList.add('draggable');
    opLi.innerHTML = `<img src="${otherIcons[op]}" class="operation-icon" width="24" height="24" alt="${op}">`;
    opLi.dataset.type = 'other';
    opLi.dataset.value = op;
    opLi.draggable = true;
    opLi.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'other',
        value: op
      }));
    });
    nestedUl.appendChild(opLi);
  });
  parentUl.appendChild(li);
}

function renderOpcuaStructure(parentUl, data) {
  for (const [name, nodeData] of Object.entries(data)) {
    const [li, nestedUl] = createCollapsibleItem(name);
    const tags = nodeData["_tags"] || {};
    for (const [tagName, tagInfo] of Object.entries(tags)) {
      const tagLi = document.createElement('li');
      const tagNameSpan = document.createElement('span');
      tagNameSpan.textContent = tagName;
      tagNameSpan.dataset.tagName = tagName;
      tagNameSpan.dataset.nodeId = tagInfo.nodeId;
      tagNameSpan.dataset.tagType = tagInfo.tagType; // "boolean" or "analog"
      tagNameSpan.style.cursor = 'grab';
      tagNameSpan.draggable = true;
      tagNameSpan.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('text/plain', JSON.stringify({
          type: 'tag',
          name: tagName,
          nodeId: tagInfo.nodeId,
          tagType: tagInfo.tagType
        }));
      });
      tagLi.appendChild(tagNameSpan);
      nestedUl.appendChild(tagLi);
    }
    const groups = nodeData["_groups"] || {};
    renderOpcuaStructure(nestedUl, groups);
    parentUl.appendChild(li);
  }
}

async function populateSidebar() {
  const logicalOpsUl = document.getElementById('logicalOperations');
  logicalOpsUl.innerHTML = '';
  renderLogicalOperations(logicalOpsUl);

  const mathOpsUl = document.getElementById('mathOperations');
  mathOpsUl.innerHTML = '';
  renderMathOperations(mathOpsUl);

  const comparisonOpsUl = document.getElementById('comparisonOperations');
  comparisonOpsUl.innerHTML = '';
  renderComparisonOperations(comparisonOpsUl);

  const otherOpsUl = document.getElementById('otherOperations');
  otherOpsUl.innerHTML = '';
  renderOtherOperations(otherOpsUl);

  const opcStructure = await fetchOpcuaStructure();
  const opcUl = document.getElementById('opcStructure');
  opcUl.innerHTML = '';
  if (Object.keys(opcStructure).length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No server connection or no structure found.';
    opcUl.appendChild(li);
  } else {
    renderOpcuaStructure(opcUl, opcStructure);
  }
}

/*********************************************************
 *  OPC-UA STRUCTURE FETCHING
 *********************************************************/
async function fetchOpcuaStructure() {
  try {
    const response = await fetch('/api/get-opcua-structure');
    if (!response.ok) {
      console.error("Failed to fetch OPC-UA structure");
      return {};
    }
    return await response.json();
  } catch (err) {
    console.error("Error fetching structure:", err);
    return {};
  }
}

/*********************************************************
 *  HELPER FUNCTION: Validate Tag Type for Operation
 *********************************************************/
function isValidTagForOperation(operationName, tagType) {
  // For tag drops: logical operations require a "boolean" tag,
  // while mathematical, comparison, and counter operations require "analog".
  const logicalOps = ["AND", "OR", "NOT", "NAND", "XOR", "NOR", "XNOR", "TIMER"];
  const numericOps = ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "AVERAGE", "COUNTER", "GREATER THAN", "LESSER THAN", "EQUAL TO"];
  if (logicalOps.includes(operationName)) {
    return tagType === "boolean";
  } else if (numericOps.includes(operationName)) {
    return tagType === "analog";
  }
  return true;
}

function isValidBoxOutputForOperation(destinationOp, sourceGroup) {
  // Validate that a box output's group matches the destination box's group.
  const destinationGroup = getOperationGroup(destinationOp);
  return sourceGroup === destinationGroup;
}

/*********************************************************
 *  HELPER: Get Operation Group by Name
 *********************************************************/
function getOperationGroup(opName) {
  const logicalOps = ["AND", "OR", "NOT", "NAND", "XOR", "NOR", "XNOR", "TIMER"];
  const mathOps = ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "AVERAGE"];
  const compOps = ["GREATER THAN", "LESSER THAN", "EQUAL TO"];
  const otherOps = ["COUNTER"];
  if (logicalOps.includes(opName)) return "logical";
  if (mathOps.includes(opName)) return "math";
  if (compOps.includes(opName)) return "comparison";
  if (otherOps.includes(opName)) return "other";
  return "";
}

/*********************************************************
 *  HELPER: Default Logical Value for Missing Inputs
 *********************************************************/
function getDefaultLogicalValue(opName) {
  // For AND, NAND, XNOR, TIMER: default to true; for OR, NOR, XOR: default to false; for NOT: false.
  if (["AND", "NAND", "XNOR", "TIMER"].includes(opName)) return true;
  if (["OR", "NOR", "XOR"].includes(opName)) return false;
  if (opName === "NOT") return false;
  return false;
}

/*********************************************************
 *  OPERATION BOX CREATION, DELETION, RESIZING, & REPOSITIONING
 *********************************************************/
function createUniqueBoxId() {
  return boxIdCounter++;
}

function createOperationBox(opType, opName, x, y) {
  let inputCount;
  if (["AND", "OR", "NOT", "NAND", "XOR", "NOR", "XNOR"].includes(opName)) {
    inputCount = (opName === "NOT") ? 1 : (["AND", "OR"].includes(opName) ? 8 : 2);
  } else if (["ADDITION", "MULTIPLICATION", "AVERAGE"].includes(opName)) {
    inputCount = 8;
  } else if (["SUBTRACTION", "DIVISION"].includes(opName)) {
    inputCount = 2;
  } else if (["GREATER THAN", "LESSER THAN", "EQUAL TO"].includes(opName)) {
    inputCount = 2;
  } else if (opName === "TIMER") {
    inputCount = 1;
  } else if (opName === "COUNTER") {
    inputCount = 2;
  } else {
    inputCount = 2;
  }

  const boxData = {
    id: createUniqueBoxId(),
    type: opType,
    operationName: opName,
    inputCount: inputCount,
    inputs: Array(inputCount).fill(null),
    outputValue: null,
    x: x - 100,
    y: y - 75,
    variableName: 'o' + boxIdCounter,
    minimized: false,
    validationAlertShown: false
  };

  if (opName === "TIMER") {
    boxData.startTime = null;
    boxData.delay = 5;
    boxData.timerMode = "On-delay";
  } else if (opName === "COUNTER") {
    boxData.count = 0;
    boxData.counterMode = "Up";
    boxData.preset = 10;
  }

  boxes.push(boxData);

  const boxEl = document.createElement('div');
  boxEl.classList.add('operation-box');
  boxEl.dataset.boxId = boxData.id;
  boxEl.style.left = (x - 100) + 'px';
  boxEl.style.top = (y - 75) + 'px';

  boxEl.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('input') ||
        e.target.classList.contains('output-handle') ||
        e.target.classList.contains('resize-handle') ||
        boxData.minimized) {
      return;
    }
    currentDragBox = boxEl;
    const rect = boxEl.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (currentDragBox) {
      const container = document.querySelector('.canvas-container');
      const containerRect = container.getBoundingClientRect();
      let newLeft = e.clientX - containerRect.left - dragOffsetX;
      let newTop = e.clientY - containerRect.top - dragOffsetY;
      newLeft = Math.max(0, Math.min(newLeft, containerRect.width - currentDragBox.offsetWidth));
      newTop = Math.max(0, Math.min(newTop, containerRect.height - currentDragBox.offsetHeight));
      currentDragBox.style.left = newLeft + 'px';
      currentDragBox.style.top = newTop + 'px';
      const bId = parseInt(currentDragBox.dataset.boxId, 10);
      const boxObj = boxes.find(b => b.id === bId);
      if (boxObj) {
        boxObj.x = newLeft;
        boxObj.y = newTop;
      }
      drawAllConnections();
    }
  });
  document.addEventListener('mouseup', () => {
    if (currentDragBox) {
      currentDragBox = null;
      recalcAndDraw();
    }
  });

  const title = document.createElement('div');
  title.classList.add('operation-name');
  title.textContent = opName;

  const toggleBtn = document.createElement('span');
  toggleBtn.classList.add('toggle-btn');
  toggleBtn.textContent = '–';
  title.appendChild(toggleBtn);

  const deleteBtn = document.createElement('span');
  deleteBtn.classList.add('delete-btn');
  deleteBtn.textContent = 'X';
  title.appendChild(deleteBtn);

  boxEl.appendChild(title);

  const outputVal = document.createElement('div');
  outputVal.classList.add('output-value');
  outputVal.textContent = "";
  boxEl.appendChild(outputVal);

  if (opName === "TIMER") {
    const configDiv = document.createElement('div');
    configDiv.classList.add('config');
    const modeLabel = document.createElement('label');
    modeLabel.textContent = "Mode:";
    configDiv.appendChild(modeLabel);
    const modeSelect = document.createElement('select');
    const onOption = document.createElement('option');
    onOption.value = "On-delay";
    onOption.textContent = "On-delay";
    const offOption = document.createElement('option');
    offOption.value = "Off-delay";
    offOption.textContent = "Off-delay";
    modeSelect.appendChild(onOption);
    modeSelect.appendChild(offOption);
    modeSelect.value = boxData.timerMode;
    modeSelect.addEventListener('change', (e) => {
      boxData.timerMode = e.target.value;
      boxData.startTime = null;
    });
    configDiv.appendChild(modeSelect);
    const delayLabel = document.createElement('label');
    delayLabel.textContent = "Delay:";
    configDiv.appendChild(delayLabel);
    const delayInput = document.createElement('input');
    delayInput.type = "number";
    delayInput.value = boxData.delay;
    delayInput.style.width = "50px";
    delayInput.addEventListener('input', (e) => {
      boxData.delay = Number(e.target.value);
      boxData.startTime = null;
    });
    configDiv.appendChild(delayInput);
    boxEl.appendChild(configDiv);
  } else if (opName === "COUNTER") {
    const configDiv = document.createElement('div');
    configDiv.classList.add('config');
    const modeLabel = document.createElement('label');
    modeLabel.textContent = "Mode:";
    configDiv.appendChild(modeLabel);
    const modeSelect = document.createElement('select');
    const upOption = document.createElement('option');
    upOption.value = "Up";
    upOption.textContent = "Up";
    const downOption = document.createElement('option');
    downOption.value = "Down";
    downOption.textContent = "Down";
    modeSelect.appendChild(upOption);
    modeSelect.appendChild(downOption);
    modeSelect.value = boxData.counterMode;
    modeSelect.addEventListener('change', (e) => {
      boxData.counterMode = e.target.value;
    });
    configDiv.appendChild(modeSelect);
    const presetLabel = document.createElement('label');
    presetLabel.textContent = "Preset:";
    configDiv.appendChild(presetLabel);
    const presetInput = document.createElement('input');
    presetInput.type = "number";
    presetInput.value = boxData.preset || 10;
    presetInput.style.width = "50px";
    presetInput.addEventListener('input', (e) => {
      boxData.preset = Number(e.target.value);
    });
    configDiv.appendChild(presetInput);
    boxEl.appendChild(configDiv);
  }

  const inputsContainer = document.createElement('div');
  inputsContainer.classList.add('inputs-container');
  for (let i = 0; i < inputCount; i++) {
    const inpEl = document.createElement('div');
    inpEl.classList.add('input');
    inpEl.textContent = '?';
    inpEl.dataset.inputIndex = i;
    inpEl.contentEditable = "true";
    inpEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tagName = inpEl.innerText.trim();
        boxData.inputs[Number(inpEl.dataset.inputIndex)] = {
          sourceType: 'tag',
          tagName: tagName,
          nodeId: null,
          value: tagName
        };
        recalcAndDraw();
        inpEl.blur();
      }
    });
    // On drop, accept the tag and validate using tagType.
    inpEl.addEventListener('dragover', (ev) => ev.preventDefault());
    inpEl.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const dStr = ev.dataTransfer.getData('text/plain');
      if (!dStr) return;
      const droppedData = JSON.parse(dStr);
      if (droppedData.type === 'tag') {
        // Validate: for logical operations, only boolean tags are allowed.
        if (!isValidTagForOperation(boxData.operationName, droppedData.tagType)) {
          alert("Invalid tag type for " + boxData.operationName + " operation.");
          return;
        }
        inpEl.textContent = droppedData.name;
        boxData.inputs[Number(inpEl.dataset.inputIndex)] = {
          sourceType: 'tag',
          tagName: droppedData.name,
          nodeId: droppedData.nodeId,
          value: (droppedData.tagType === "boolean") ? false : 0
        };
        recalcAndDraw();
      } else if (droppedData.type === 'boxOutput') {
        // Validate that output box's group matches destination box's group.
        const sourceGroup = droppedData.group;
        const destGroup = getOperationGroup(boxData.operationName);
        if (sourceGroup !== destGroup) {
          alert("Incompatible box connection: source (" + sourceGroup + ") vs destination (" + destGroup + ")");
          return;
        }
        inpEl.textContent = droppedData.variableName;
        boxData.inputs[Number(inpEl.dataset.inputIndex)] = {
          sourceType: 'box',
          sourceId: droppedData.sourceId,
          variableName: droppedData.variableName
        };
        connections.push({
          fromBoxId: droppedData.sourceId,
          toBoxId: boxData.id,
          toInputIndex: Number(inpEl.dataset.inputIndex)
        });
        recalcAndDraw();
      }
    });
    inputsContainer.appendChild(inpEl);
  }
  boxEl.appendChild(inputsContainer);

  const outputHandle = document.createElement('div');
  outputHandle.classList.add('output-handle');
  outputHandle.draggable = true;
  outputHandle.addEventListener('dragstart', (e) => {
    const sourceGroup = getOperationGroup(boxData.operationName);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'boxOutput',
      sourceId: boxData.id,
      variableName: boxData.variableName,
      group: sourceGroup
    }));
    outputHandle.classList.add('dragging');
  });
  outputHandle.addEventListener('dragend', (e) => {
    outputHandle.classList.remove('dragging');
  });
  boxEl.appendChild(outputHandle);

  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle');
  boxEl.appendChild(resizeHandle);
  resizeHandle.addEventListener('mousedown', (e) => {
    if (boxData.minimized) return;
    currentResizeBox = boxEl;
    resizeStartWidth = boxEl.offsetWidth;
    resizeStartHeight = boxEl.offsetHeight;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    e.preventDefault();
    e.stopPropagation();
  });
  document.addEventListener('mousemove', (e) => {
    if (currentResizeBox) {
      const newWidth = Math.max(150, resizeStartWidth + (e.clientX - resizeStartX));
      const newHeight = Math.max(100, resizeStartHeight + (e.clientY - resizeStartY));
      currentResizeBox.style.width = newWidth + 'px';
      currentResizeBox.style.height = newHeight + 'px';
      recalcAndDraw();
    }
  });
  document.addEventListener('mouseup', () => {
    if (currentResizeBox) {
      currentResizeBox = null;
    }
  });

  document.querySelector('.canvas-container').appendChild(boxEl);

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!boxData.minimized) {
      boxData.minimized = true;
      boxEl.classList.add('minimized');
      inputsContainer.style.display = 'none';
      outputVal.style.display = 'none';
      const configDiv = boxEl.querySelector('.config');
      if (configDiv) configDiv.style.display = 'none';
      toggleBtn.textContent = '+';
    } else {
      boxData.minimized = false;
      boxEl.classList.remove('minimized');
      inputsContainer.style.display = '';
      outputVal.style.display = '';
      const configDiv = boxEl.querySelector('.config');
      if (configDiv) configDiv.style.display = '';
      toggleBtn.textContent = '–';
      recalcAndDraw();
    }
  });

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    boxes = boxes.filter(b => b.id !== boxData.id);
    connections = connections.filter(conn => conn.fromBoxId !== boxData.id && conn.toBoxId !== boxData.id);
    boxEl.remove();
    recalcAndDraw();
  });

  return boxData;
}

/*********************************************************
 *  DRAWING LINES
 *********************************************************/
function drawAllConnections() {
  const linesCanvas = document.getElementById('linesCanvas');
  const ctx = linesCanvas.getContext('2d');
  ctx.clearRect(0, 0, linesCanvas.width, linesCanvas.height);
  resizeCanvases();
  connections.forEach(conn => {
    const fromBox = boxes.find(b => b.id === conn.fromBoxId);
    const toBox = boxes.find(b => b.id === conn.toBoxId);
    if (!fromBox || !toBox || fromBox.minimized || toBox.minimized) return;
    const fromPt = getBoxOutputCenter(fromBox);
    const toPt = getBoxInputCenter(toBox, conn.toInputIndex);
    const cRect = linesCanvas.getBoundingClientRect();
    const startX = fromPt.x - cRect.left;
    const startY = fromPt.y - cRect.top;
    const endX = toPt.x - cRect.left;
    const endY = toPt.y - cRect.top;
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(startX + 50, startY, endX - 50, endY, endX, endY);
    ctx.stroke();
  });
}

function getBoxOutputCenter(box) {
  const boxEl = document.querySelector(`.operation-box[data-box-id='${box.id}']`);
  if (!boxEl) return { x: box.x + 220, y: box.y + 110 };
  const rect = boxEl.getBoundingClientRect();
  return { x: rect.right - 8, y: rect.top + rect.height / 2 };
}

function getBoxInputCenter(box, inputIndex) {
  const boxEl = document.querySelector(`.operation-box[data-box-id='${box.id}']`);
  if (!boxEl) return { x: box.x, y: box.y };
  const inpEl = boxEl.querySelector(`.input[data-input-index='${inputIndex}']`);
  if (!inpEl) return { x: box.x, y: box.y };
  const rect = inpEl.getBoundingClientRect();
  return { x: rect.left, y: rect.top + rect.height / 2 };
}

/*********************************************************
 *  EVALUATION
 *********************************************************/
function evaluateBox(box) {
  if (box.minimized) return;
  
  const inputValues = box.inputs.map(inp => {
    if (!inp) return null;
    if (inp.sourceType === 'tag') {
      return inp.value;
    }
    if (inp.sourceType === 'box') {
      const sourceBox = boxes.find(b => b.id === inp.sourceId);
      return sourceBox ? sourceBox.outputValue : null;
    }
    return null;
  });

  let result = null;
  let errorMsg = null;
  
  // Logical Operations: require boolean values.
  if (["AND", "OR", "NOT", "NAND", "XOR", "NOR", "XNOR"].includes(box.operationName)) {
    let expected = (box.operationName === "NOT") ? 1 : (["AND", "OR"].includes(box.operationName) ? 8 : 2);
    for (let i = 0; i < expected; i++) {
      if (inputValues[i] === null) {
        inputValues[i] = getDefaultLogicalValue(box.operationName);
      }
      if (typeof inputValues[i] === "number") {
        inputValues[i] = (inputValues[i] === 1);
      }
      if (typeof inputValues[i] !== "boolean") {
        errorMsg = `Error: Input ${i+1} must be a boolean.`;
        break;
      }
    }
    if (!errorMsg) {
      if (box.operationName === "NOT") {
        result = !inputValues[0];
      } else if (box.operationName === "AND") {
        result = inputValues.every(val => val === true);
      } else if (box.operationName === "OR") {
        result = inputValues.some(val => val === true);
      } else {
        const a = inputValues[0];
        const b = inputValues[1];
        switch (box.operationName) {
          case 'NAND':
            result = !(a && b);
            break;
          case 'XOR':
            result = (a && !b) || (!a && b);
            break;
          case 'NOR':
            result = !(a || b);
            break;
          case 'XNOR':
            result = !((a && !b) || (!a && b));
            break;
          default:
            errorMsg = "Error: Unknown logical operation.";
        }
      }
    }
  }
  // Mathematical Operations: require numeric inputs.
  else if (["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "AVERAGE"].includes(box.operationName)) {
    let nums = [];
    let expected = (box.operationName === "SUBTRACTION" || box.operationName === "DIVISION") ? 2 : box.inputCount;
    if (box.inputs.length < expected) {
      errorMsg = "Error: Missing numeric input(s) for mathematical operation.";
    } else {
      for (let i = 0; i < expected; i++) {
        const val = inputValues[i];
        if (val === null || val === undefined || typeof val !== "number" || isNaN(val)) {
          errorMsg = "Error: All inputs must be valid numbers for mathematical operations.";
          break;
        } else {
          nums.push(val);
        }
      }
    }
    if (!errorMsg) {
      switch (box.operationName) {
        case 'ADDITION':
          result = nums.reduce((a, b) => a + b, 0);
          break;
        case 'SUBTRACTION':
          result = nums[0] - nums[1];
          break;
        case 'MULTIPLICATION':
          result = nums.reduce((a, b) => a * b, 1);
          break;
        case 'DIVISION':
          if (nums[1] === 0) {
            errorMsg = "Error: Division by zero.";
          } else {
            result = nums[0] / nums[1];
          }
          break;
        case 'AVERAGE':
          result = nums.reduce((a, b) => a + b, 0) / nums.length;
          break;
        default:
          errorMsg = "Error: Unknown mathematical operation.";
      }
    }
  }
  // Comparison Operations: require numeric inputs.
  else if (["GREATER THAN", "LESSER THAN", "EQUAL TO"].includes(box.operationName)) {
    if (box.inputs.length < 2) {
      errorMsg = "Error: Comparison operations require exactly two inputs.";
    } else {
      const val1 = inputValues[0];
      const val2 = inputValues[1];
      if (typeof val1 !== "number" || isNaN(val1) || typeof val2 !== "number" || isNaN(val2)) {
        errorMsg = "Error: Both inputs must be valid numbers for comparison.";
      } else {
        switch (box.operationName) {
          case 'GREATER THAN':
            result = val1 > val2;
            break;
          case 'LESSER THAN':
            result = val1 < val2;
            break;
          case 'EQUAL TO':
            result = val1 === val2;
            break;
          default:
            errorMsg = "Error: Unknown comparison operation.";
        }
      }
    }
  }
  // TIMER and COUNTER operations remain unchanged.
  else if (["TIMER", "COUNTER"].includes(box.operationName)) {
    if (box.operationName === "TIMER") {
      if (typeof box.delay !== "number" || isNaN(box.delay) || box.delay <= 0) {
        errorMsg = "Error: Timer delay must be a positive number.";
      } else {
        const trigger = inputValues[0] === true;
        if (box.timerMode === "On-delay") {
          if (trigger) {
            if (!box.startTime) box.startTime = Date.now();
            const elapsed = (Date.now() - box.startTime) / 1000;
            result = elapsed >= box.delay ? true + " ALARM" : false;
          } else {
            box.startTime = null;
            result = false;
          }
        } else if (box.timerMode === "Off-delay") {
          if (!trigger) {
            if (!box.startTime) box.startTime = Date.now();
            const elapsed = (Date.now() - box.startTime) / 1000;
            result = elapsed >= box.delay ? false + " ALARM" : true;
          } else {
            box.startTime = null;
            result = true;
          }
        }
      }
    } else if (box.operationName === "COUNTER") {
      const inc = (box.inputs[0] && typeof box.inputs[0].value === 'number') ? Number(box.inputs[0].value) : null;
      const reset = (box.inputs[1] && typeof box.inputs[1].value === 'number') ? Number(box.inputs[1].value) : null;
      if (inc === null || reset === null) {
        errorMsg = "Error: Counter inputs must be valid numbers.";
      } else {
        if (reset !== 0) {
          box.count = 0;
        } else if (inc !== 0) {
          box.count = box.counterMode === "Up" ? (box.count || 0) + inc : (box.count || 0) - inc;
        }
        result = box.count || 0;
        if (box.counterMode === "Up" && box.preset !== undefined && box.count >= box.preset) {
          result = result + " ALARM";
        }
        if (box.counterMode === "Down" && box.preset !== undefined && box.count <= box.preset) {
          result = result + " ALARM";
        }
      }
    }
  }
  else {
    errorMsg = "Error: Unknown operation.";
  }
  
  if (errorMsg) {
    // For evaluation errors, alert is retained.
    alert(errorMsg);
    box.outputValue = "";
  } else {
    box.outputValue = result;
    box.validationAlertShown = false;
  }
}

function recalcAllBoxes() {
  boxes.forEach(b => evaluateBox(b));
  boxes.forEach(b => {
    const boxEl = document.querySelector(`.operation-box[data-box-id='${b.id}']`);
    if (boxEl) {
      const outValEl = boxEl.querySelector('.output-value');
      if (!b.minimized && outValEl) {
        outValEl.textContent = b.outputValue !== null ? b.outputValue : "";
      }
    }
  });
}

function recalcAndDraw() {
  recalcAllBoxes();
  drawAllConnections();
}

/*********************************************************
 *  POLLING: UPDATE TAG VALUES FOR OPERATION BOXES
 *********************************************************/
function updateTagValues() {
  boxes.forEach((box) => {
    box.inputs.forEach((inp, i) => {
      if (inp && inp.sourceType === 'tag') {
        fetch('/api/get-tag-value', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ node_id: inp.nodeId })
        })
        .then(response => response.json())
        .then(data => {
          inp.value = data.value;
          const boxEl = document.querySelector(`.operation-box[data-box-id='${box.id}']`);
          if (boxEl) {
            const inpEl = boxEl.querySelector(`.input[data-input-index='${i}']`);
            if (inpEl) {
              inpEl.textContent = data.value;
            }
          }
          recalcAndDraw();
        })
        .catch(err => {
          console.error("Error updating tag value:", err);
        });
      }
    });
  });
}

/*********************************************************
 *  RESIZING CANVASES
 *********************************************************/
function resizeCanvases() {
  const container = document.querySelector('.canvas-container');
  const rect = container.getBoundingClientRect();
  const logicCanvas = document.getElementById('logicCanvas');
  const linesCanvas = document.getElementById('linesCanvas');
  logicCanvas.width = rect.width;
  logicCanvas.height = rect.height;
  linesCanvas.width = rect.width;
  linesCanvas.height = rect.height;
}

/*********************************************************
 *  CANVAS INIT
 *********************************************************/
function initializeCanvas() {
  const logicCanvas = document.getElementById('logicCanvas');
  resizeCanvases();
  window.addEventListener('resize', () => {
    resizeCanvases();
    recalcAndDraw();
  });
  logicCanvas.addEventListener('dragover', (e) => e.preventDefault());
  logicCanvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('text/plain');
    if (!dataStr) return;
    const item = JSON.parse(dataStr);
    const rect = logicCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (["logicalOperation", "operation", "comparison", "other"].includes(item.type)) {
      createOperationBox(item.type, item.value, x, y);
      recalcAndDraw();
    }
  });
}

/*********************************************************
 *  MAIN
 *********************************************************/
window.onload = async () => {
  try {
    await populateSidebar();
    initializeCanvas();
    recalcAndDraw();
    setInterval(updateTagValues, 1000);
    const runButton = document.getElementById('runButton');
    runButton.addEventListener('click', function() {
      if (pollingIntervalId === null) {
        pollingIntervalId = setInterval(updateTagValues, 1000);
        this.textContent = "Stop";
      } else {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
        this.textContent = "Run";
      }
    });
  } catch (err) {
    console.error("Initialization error:", err);
  }
};
