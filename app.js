const STORAGE_KEY = "memo-mind-map-v4";
const DEFAULT_COLOR = "#6ee7b7";
const COLOR_TEMPLATES = [
  "#6ee7b7",
  "#67e8f9",
  "#93c5fd",
  "#c4b5fd",
  "#f9a8d4",
  "#fca5a5",
  "#fde68a",
  "#fdba74"
];

const initialData = {
  id: crypto.randomUUID(),
  heading: "中心",
  content: "",
  color: "#67e8f9",
  collapsed: false,
  side: "root",
  children: []
};

let data = loadData();
let selectedId = data.id;
let allCollapsed = false;
let isRendering = false;

const treeContainer = document.getElementById("treeContainer");
const headingInput = document.getElementById("headingInput");
const contentInput = document.getElementById("contentInput");
const colorInput = document.getElementById("colorInput");
const colorPalette = document.getElementById("colorPalette");
const saveStatus = document.getElementById("saveStatus");

const addChildButton = document.getElementById("addChildButton");
const addSiblingButton = document.getElementById("addSiblingButton");
const deleteButton = document.getElementById("deleteButton");
const exportButton = document.getElementById("exportButton");
const importInput = document.getElementById("importInput");
const resetTemplateButton = document.getElementById("resetTemplateButton");
const expandAllButton = document.getElementById("expandAllButton");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeNode(node, fallbackSide = "right") {
  const side = node.side || fallbackSide;
  return {
    id: node.id || crypto.randomUUID(),
    heading: node.heading ?? node.title ?? "",
    content: node.content ?? node.body ?? "",
    color: node.color || DEFAULT_COLOR,
    collapsed: Boolean(node.collapsed),
    side,
    children: (node.children || []).map(child => normalizeNode(child, side === "root" ? "right" : side))
  };
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return clone(initialData);

  try {
    const loaded = normalizeNode(JSON.parse(saved), "root");
    loaded.side = "root";
    return loaded;
  } catch {
    return clone(initialData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  saveStatus.textContent = "保存済み";
}

function findNode(id, node = data, parent = null) {
  if (node.id === id) return { node, parent };

  for (const child of node.children) {
    const found = findNode(id, child, node);
    if (found) return found;
  }

  return null;
}

function getSelectedNode() {
  return findNode(selectedId)?.node ?? data;
}

function updateEditor() {
  const selectedNode = getSelectedNode();
  isRendering = true;
  headingInput.value = selectedNode.heading;
  contentInput.value = selectedNode.content;
  colorInput.value = selectedNode.color || DEFAULT_COLOR;
  deleteButton.disabled = selectedNode.id === data.id;
  isRendering = false;
}

function renderColorPalette() {
  colorPalette.innerHTML = "";
  const selectedNode = getSelectedNode();

  COLOR_TEMPLATES.forEach(color => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `color-chip ${selectedNode.color === color ? "active" : ""}`;
    button.style.background = color;
    button.title = color;
    button.addEventListener("click", () => {
      selectedNode.color = color;
      colorInput.value = color;
      saveData();
      renderTree();
    });
    colorPalette.appendChild(button);
  });
}

function renderTree() {
  treeContainer.innerHTML = "";

  const map = document.createElement("div");
  map.className = "mind-map";

  const leftBranch = document.createElement("div");
  leftBranch.className = "branch branch-left";

  const center = document.createElement("div");
  center.className = "center-area";
  center.appendChild(renderNodeCard(data, true));

  const rightBranch = document.createElement("div");
  rightBranch.className = "branch branch-right";

  const leftChildren = data.children.filter(child => child.side === "left");
  const rightChildren = data.children.filter(child => child.side !== "left");

  leftChildren.forEach(child => leftBranch.appendChild(renderBranch(child, "left")));
  rightChildren.forEach(child => rightBranch.appendChild(renderBranch(child, "right")));

  map.append(leftBranch, center, rightBranch);
  treeContainer.appendChild(map);
  updateEditor();
  renderColorPalette();
}

function renderBranch(node, side) {
  const wrapper = document.createElement("div");
  wrapper.className = `branch-node ${side === "left" ? "left-node" : "right-node"}`;

  wrapper.appendChild(renderNodeCard(node));

  if (!node.collapsed && node.children.length) {
    const children = document.createElement("div");
    children.className = "branch-children";
    node.children.forEach(child => children.appendChild(renderBranch(child, side)));
    wrapper.appendChild(children);
  }

  return wrapper;
}

function renderNodeCard(node, isRoot = false) {
  const card = document.createElement("div");
  card.className = `node-card ${isRoot ? "root-card" : ""} ${node.id === selectedId ? "selected" : ""}`;
  card.dataset.nodeId = node.id;
  card.style.setProperty("--node-color", node.color || DEFAULT_COLOR);

  const top = document.createElement("div");
  top.className = "node-top";

  const toggle = document.createElement("button");
  toggle.className = "toggle-button";
  toggle.type = "button";
  toggle.dataset.action = "toggle";
  toggle.dataset.nodeId = node.id;
  toggle.textContent = node.children.length ? (node.collapsed ? "+" : "−") : "・";
  toggle.title = "開閉";

  const heading = document.createElement("h3");
  heading.className = "node-heading";
  heading.textContent = node.heading || "無題";

  top.append(toggle, heading);
  card.appendChild(top);

  if (node.content) {
    const content = document.createElement("p");
    content.className = "node-content";
    content.textContent = node.content.length > 90 ? `${node.content.slice(0, 90)}...` : node.content;
    card.appendChild(content);
  }

  const cardActions = document.createElement("div");
  cardActions.className = "card-actions";

  const addBranchButton = document.createElement("button");
  addBranchButton.className = "branch-button";
  addBranchButton.type = "button";
  addBranchButton.dataset.action = "add-child";
  addBranchButton.dataset.nodeId = node.id;
  addBranchButton.textContent = "＋";
  addBranchButton.title = "枝を追加";

  cardActions.appendChild(addBranchButton);
  card.appendChild(cardActions);

  return card;
}

function createNewMemo(side = "right") {
  return {
    id: crypto.randomUUID(),
    heading: "",
    content: "",
    color: COLOR_TEMPLATES[Math.floor(Math.random() * COLOR_TEMPLATES.length)],
    collapsed: false,
    side,
    children: []
  };
}

function getNextRootSide() {
  const leftCount = data.children.filter(child => child.side === "left").length;
  const rightCount = data.children.filter(child => child.side !== "left").length;
  return rightCount <= leftCount ? "right" : "left";
}

function addChildToNode(nodeId) {
  const found = findNode(nodeId);
  const target = found?.node;
  if (!target) return;

  const side = target.id === data.id ? getNextRootSide() : target.side;
  const child = createNewMemo(side);
  target.children.push(child);
  target.collapsed = false;
  selectedId = child.id;
  saveData();
  renderTree();
}

function addChild() {
  addChildToNode(selectedId);
}

function addSibling() {
  const found = findNode(selectedId);
  if (!found?.parent) {
    addChild();
    return;
  }

  const sibling = createNewMemo(found.node.side || "right");
  found.parent.children.push(sibling);
  selectedId = sibling.id;
  saveData();
  renderTree();
}

function deleteSelected() {
  const found = findNode(selectedId);
  if (!found?.parent) return;

  const ok = confirm("選択した要素を削除しますか？");
  if (!ok) return;

  found.parent.children = found.parent.children.filter(child => child.id !== selectedId);
  selectedId = found.parent.id;
  saveData();
  renderTree();
}

function updateSelectedFromEditor() {
  if (isRendering) return;

  const selectedNode = getSelectedNode();
  selectedNode.heading = headingInput.value;
  selectedNode.content = contentInput.value;
  selectedNode.color = colorInput.value;
  saveStatus.textContent = "保存中...";
  saveData();
  renderTree();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `memo-tree-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      data = normalizeNode(JSON.parse(reader.result), "root");
      data.side = "root";
      selectedId = data.id;
      saveData();
      renderTree();
    } catch {
      alert("読み込めるJSON形式ではありません。");
    } finally {
      importInput.value = "";
    }
  };
  reader.readAsText(file);
}

function setCollapsedState(node, collapsed) {
  node.collapsed = collapsed;
  node.children.forEach(child => setCollapsedState(child, collapsed));
}

function resetTemplate() {
  const ok = confirm("リセットしますか？");
  if (!ok) return;

  data = clone(initialData);
  selectedId = data.id;
  saveData();
  renderTree();
}

headingInput.addEventListener("change", updateSelectedFromEditor);
contentInput.addEventListener("change", updateSelectedFromEditor);
colorInput.addEventListener("input", updateSelectedFromEditor);

addChildButton.onclick = () => addChild();
addSiblingButton.onclick = () => addSibling();
deleteButton.onclick = () => deleteSelected();
exportButton.onclick = () => exportJson();
resetTemplateButton.onclick = () => resetTemplate();
importInput.addEventListener("change", importJson);
expandAllButton.onclick = () => {
  allCollapsed = !allCollapsed;
  setCollapsedState(data, allCollapsed);
  saveData();
  renderTree();
};

treeContainer.addEventListener("click", event => {
  const actionButton = event.target.closest("button[data-action]");
  if (actionButton) {
    event.preventDefault();
    event.stopPropagation();

    const nodeId = actionButton.dataset.nodeId;
    const action = actionButton.dataset.action;

    if (action === "add-child") addChildToNode(nodeId);
    if (action === "toggle") {
      const target = findNode(nodeId)?.node;
      if (!target || !target.children.length) return;
      target.collapsed = !target.collapsed;
      saveData();
      renderTree();
    }
    return;
  }

  const card = event.target.closest(".node-card");
  if (!card) return;
  selectedId = card.dataset.nodeId;
  renderTree();
});

saveData();
renderTree();
