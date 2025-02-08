/*********************************************************
 *  GLOBAL DATA
 *********************************************************/
let boxIdCounter = 1;
let boxes = [];        // Array holding all operation boxes
let connections = [];  // Array of connections { fromBoxId, toBoxId, toInputIndex }
let pollingIntervalId = null; // For Run button polling

// Variables for repositioning
let currentDragBox = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Variables for resizing
let currentResizeBox = null;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let resizeStartX = 0;
let resizeStartY = 0;

/*********************************************************
 *  SIDEBAR CREATION
 *********************************************************/
// Helper function to create a collapsible list item
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

// Render OPC UA structure (channels, devices, tags)
function renderOpcuaStructure(parentUl, data) {
  for (const [name, nodeData] of Object.entries(data)) {
    const [li, nestedUl] = createCollapsibleItem(name);
    const tags = nodeData["_tags"] || {};
    for (const [tagName, nodeId] of Object.entries(tags)) {
      const tagLi = document.createElement('li');
      const tagNameSpan = document.createElement('span');
      tagNameSpan.textContent = tagName;
      tagNameSpan.style.cursor = 'grab';
      tagNameSpan.draggable = true;
      tagNameSpan.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('text/plain', JSON.stringify({
          type: 'tag',
          name: tagName,
          nodeId: nodeId
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

// Render Logical Operations category
function renderLogicalOperations(parentUl) {
  const [li, nestedUl] = createCollapsibleItem("Logical Operations");
  const ops = ["AND", "OR", "NOT", "NAND", "XOR", "NOR", "XNOR"];
  ops.forEach(op => {
    const opLi = document.createElement('li');
    opLi.classList.add('draggable');
    opLi.textContent = op;
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

// Render Mathematical Operations category
function renderMathOperations(parentUl) {
  const [li, nestedUl] = createCollapsibleItem("Mathematical Operations");
  const ops = ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "AVERAGE"];
  ops.forEach(op => {
    const opLi = document.createElement('li');
    opLi.classList.add('draggable');
    opLi.textContent = op;
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

// Render Comparison Operations category
function renderComparisonOperations(parentUl) {
  const [li, nestedUl] = createCollapsibleItem("Comparison Operations");
  const ops = ["GREATER THAN", "LESSER THAN", "EQUAL TO"];
  ops.forEach(op => {
    const opLi = document.createElement('li');
    opLi.classList.add('draggable');
    opLi.textContent = op;
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

// Render Other Operations category
function renderOtherOperations(parentUl) {
  const [li, nestedUl] = createCollapsibleItem("Other Operations");
  const ops = ["TIMER", "COUNTER"];
  ops.forEach(op => {
    const opLi = document.createElement('li');
    opLi.classList.add('draggable');
    opLi.textContent = op;
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

// Populate sidebar with operation categories and OPC UA structure (including "stroi" channel)
async function populateSidebar() {
  // Operation Categories
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

  // OPC UA Structure (including stroi channel)
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
 *  OPERATION BOX CREATION, DELETION, & REPOSITIONING
 *********************************************************/
function createUniqueBoxId() {
  return boxIdCounter++;
}

function createOperationBox(opType, opName, x, y) {
  const boxId = createUniqueBoxId();
  let inputCount;
  if (["AND", "OR", "NOT", "NAND", "XOR", "NOR", "XNOR"].includes(opName)) {
    inputCount = opName === "NOT" ? 1 : 2;
  } else if (["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "AVERAGE"].includes(opName)) {
    inputCount = 8;
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
    id: boxId,
    type: opType,
    operationName: opName,
    inputCount: inputCount,
    inputs: Array(inputCount).fill(null),
    outputValue: null,
    x: x - 100,
    y: y - 75,
    variableName: 'o' + boxId,
    minimized: false
  };

  // Additional properties for TIMER and COUNTER
  if (opName === "TIMER") {
    boxData.startTime = Date.now();
    boxData.delay = 5; // Default delay in seconds
  } else if (opName === "COUNTER") {
    boxData.count = 0;
  }

  boxes.push(boxData);

  const boxEl = document.createElement('div');
  boxEl.classList.add('operation-box');
  boxEl.dataset.boxId = boxId;
  boxEl.style.left = (x - 100) + 'px';
  boxEl.style.top = (y - 75) + 'px';

  // Repositioning listeners (only if not minimized)
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

  // Title bar with toggle and delete buttons
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

  // Delete button event: remove the box and its connections
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Remove from boxes array
    boxes = boxes.filter(b => b.id !== boxData.id);
    // Remove any connections referencing this box
    connections = connections.filter(conn => conn.fromBoxId !== boxData.id && conn.toBoxId !== boxData.id);
    // Remove the DOM element
    boxEl.remove();
    recalcAndDraw();
  });

  // Output display with variable name
  const outputVal = document.createElement('div');
  outputVal.classList.add('output-value');
  outputVal.textContent = "Output (" + boxData.variableName + "): ?";
  boxEl.appendChild(outputVal);

  // Inputs container
  const inputsContainer = document.createElement('div');
  inputsContainer.classList.add('inputs-container');
  for (let i = 0; i < inputCount; i++) {
    const inpEl = document.createElement('div');
    inpEl.classList.add('input');
    inpEl.textContent = '?';
    inpEl.dataset.inputIndex = i;
    inpEl.addEventListener('dragover', (ev) => ev.preventDefault());
    inpEl.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const dStr = ev.dataTransfer.getData('text/plain');
      if (!dStr) return;
      const droppedData = JSON.parse(dStr);
      if (droppedData.type === 'tag') {
        inpEl.textContent = droppedData.name;
        boxData.inputs[i] = {
          sourceType: 'tag',
          tagName: droppedData.name,
          nodeId: droppedData.nodeId,
          value: 0
        };
        recalcAndDraw();
      } else if (droppedData.type === 'boxOutput') {
        inpEl.textContent = droppedData.variableName;
        boxData.inputs[i] = {
          sourceType: 'box',
          sourceId: droppedData.sourceId,
          variableName: droppedData.variableName
        };
        connections.push({
          fromBoxId: droppedData.sourceId,
          toBoxId: boxData.id,
          toInputIndex: i
        });
        recalcAndDraw();
      }
    });
    inputsContainer.appendChild(inpEl);
  }
  boxEl.appendChild(inputsContainer);

  // Output handle (draggable output)
  const handle = document.createElement('div');
  handle.classList.add('output-handle');
  handle.draggable = true;
  handle.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'boxOutput',
      sourceId: boxData.id,
      variableName: boxData.variableName
    }));
    handle.classList.add('dragging');
  });
  handle.addEventListener('dragend', (e) => {
    handle.classList.remove('dragging');
  });
  boxEl.appendChild(handle);

  // Resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle');
  boxEl.appendChild(resizeHandle);

  // Resize handle event
  resizeHandle.addEventListener('mousedown', (e) => {
    if (boxData.minimized) return; // Do not allow resizing when minimized
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
    if (!inp) return (box.type === 'logicalOperation') ? false : null;
    if (inp.sourceType === 'tag') {
      let tagVal = inp.hasOwnProperty("value") ? inp.value : ((box.type === 'logicalOperation') ? false : null);
      if (box.type === 'logicalOperation' && typeof tagVal === 'number') {
        tagVal = tagVal === 0 ? false : (tagVal === 1 ? true : tagVal);
      }
      return tagVal;
    }
    if (inp.sourceType === 'box') {
      const sourceBox = boxes.find(b => b.id === inp.sourceId);
      if (!sourceBox) return (box.type === 'logicalOperation') ? false : null;
      return sourceBox.outputValue ?? null;
    }
    return null;
  });

  let result = null;
  // Logical Operations Evaluation
  if (["AND", "OR", "NOT", "NAND", "XOR", "NOR", "XNOR"].includes(box.operationName)) {
    switch (box.operationName) {
      case 'NOT':
        result = !inputValues[0];
        break;
      case 'AND':
        result = inputValues[0] && inputValues[1];
        break;
      case 'OR':
        result = inputValues[0] || inputValues[1];
        break;
      case 'NAND':
        result = !(inputValues[0] && inputValues[1]);
        break;
      case 'XOR':
        result = (inputValues[0] && !inputValues[1]) || (!inputValues[0] && inputValues[1]);
        break;
      case 'NOR':
        result = !(inputValues[0] || inputValues[1]);
        break;
      case 'XNOR':
        result = !((inputValues[0] && !inputValues[1]) || (!inputValues[0] && inputValues[1]));
        break;
      default:
        result = false;
    }
  }
  // Mathematical Operations Evaluation
  else if (["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "AVERAGE"].includes(box.operationName)) {
    const validInputs = inputValues.map(v => (v === null ? 0 : v));
    switch (box.operationName) {
      case 'ADDITION':
        result = validInputs.reduce((a, b) => a + b, 0);
        break;
      case 'SUBTRACTION':
        if (validInputs.length === 0) result = 0;
        else {
          result = validInputs[0];
          for (let i = 1; i < validInputs.length; i++) {
            result -= validInputs[i];
          }
        }
        break;
      case 'MULTIPLICATION': {
        // Use only the first two valid numeric inputs
        const nums = validInputs.filter(v => typeof v === 'number');
        if (nums.length < 2) {
          result = nums.length === 1 ? nums[0] : 0;
        } else {
          result = nums[0] * nums[1];
        }
        break;
      }
      case 'DIVISION': {
        // Use only the first two valid numeric inputs
        const nums = validInputs.filter(v => typeof v === 'number');
        if (nums.length < 2) {
          result = nums.length === 1 ? nums[0] : 0;
        } else {
          if (nums[1] === 0) {
            result = 0;
          } else {
            result = nums[0] / nums[1];
          }
        }
        break;
      }
      case 'AVERAGE': {
        const nums = validInputs.filter(v => typeof v === 'number');
        result = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        break;
      }
      default:
        result = 0;
    }
  }
  // Comparison Operations Evaluation
  else if (["GREATER THAN", "LESSER THAN", "EQUAL TO"].includes(box.operationName)) {
    switch (box.operationName) {
      case 'GREATER THAN':
        result = inputValues[0] > inputValues[1];
        break;
      case 'LESSER THAN':
        result = inputValues[0] < inputValues[1];
        break;
      case 'EQUAL TO':
        result = inputValues[0] == inputValues[1];
        break;
      default:
        result = false;
    }
  }
  // Other Operations Evaluation (TIMER and COUNTER)
  else if (["TIMER", "COUNTER"].includes(box.operationName)) {
    if (box.operationName === "TIMER") {
      let delayInput = box.inputs[0];
      let delayValue = (delayInput && typeof delayInput.value === 'number') ? delayInput.value : box.delay || 5;
      if (!box.startTime) box.startTime = Date.now();
      let elapsed = (Date.now() - box.startTime) / 1000;
      result = elapsed < delayValue ? elapsed : delayValue;
    } else if (box.operationName === "COUNTER") {
      let inc = (box.inputs[0] && typeof box.inputs[0].value === 'number') ? box.inputs[0].value : 0;
      let reset = (box.inputs[1] && typeof box.inputs[1].value === 'number') ? box.inputs[1].value : 0;
      if (reset !== 0) {
        box.count = 0;
      } else if (inc !== 0) {
        box.count = (box.count || 0) + inc;
      }
      result = box.count || 0;
    }
  }
  else {
    result = 0;
  }
  box.outputValue = result;
}

function recalcAllBoxes() {
  boxes.forEach(b => evaluateBox(b));
  boxes.forEach(b => {
    const boxEl = document.querySelector(`.operation-box[data-box-id='${b.id}']`);
    if (boxEl) {
      const outValEl = boxEl.querySelector('.output-value');
      if (!b.minimized && outValEl) {
        outValEl.textContent = "Output (" + b.variableName + "): " + b.outputValue;
      }
    }
  });
}

function recalcAndDraw() {
  recalcAllBoxes();
  drawAllConnections();
}

/*********************************************************
 *  POLLING: UPDATE TAG VALUES
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
