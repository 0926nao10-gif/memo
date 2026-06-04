const STORAGE_KEY = "memo-branch-tree-v1";

const initialData = {
  id: crypto.randomUUID(),
  heading: "自己分析メモ",
  content: "ここを起点に、経験・強み・価値観などを枝分かれさせて整理します。",
  collapsed: false,
  children: [
    {
      id: crypto.randomUUID(),
      heading: "経験",
      content: "学生生活、サークル、授業、アルバイト、研究などを書き出す。",
      collapsed: false,
      children: [
        {
          id: crypto.randomUUID(),
          heading: "アカペラサークルの運営",
          content: "約100名規模のサークルで、幹部として会議や資料共有の仕組みを整えた。",
          collapsed: false,
          children: []
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      heading: "強み",
      content: "自分がどんな場面で力を発揮できるかを書く。",
      collapsed: false,
      children: []
    }
  ]
};

let data = loadData();
let selectedId = data.id;
let allCollapsed = false;

const treeContainer = document.getElementById("treeContainer");
const headingInput = document.getElementById("headingInput");
const contentInput = document.getElementById("contentInput");
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

function normalizeNode(node) {
  return {
    id: node.id || crypto.randomUUID(),
    heading: node.heading || node.title || "無題のメモ",
    content: node.content || node.body || "",
    collapsed: Boolean(node.collapsed),
    children: (node.children || []).map(normalizeNode)
  };
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return clone(initialData);

  try {
    return normalizeNode(JSON.parse(saved));
  } catch {
    return clone(initialData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  saveStatus.textContent = "自動保存済み";
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
  headingInput.value = selectedNode.heading;
  contentInput.value = selectedNode.content;
  deleteButton.disabled = selectedNode.id === data.id;
}

function renderTree() {
  treeContainer.innerHTML = "";
  const list = document.createElement("ul");
  list.className = "tree-list";
  list.appendChild(renderNode(data));
  treeContainer.appendChild(list);
  updateEditor();
}

function renderNode(node) {
  const item = document.createElement("li");
  item.className = "tree-item";

  const card = document.createElement("div");
  card.className = `node-card ${node.id === selectedId ? "selected" : ""}`;
  card.addEventListener("click", () => {
    selectedId = node.id;
    renderTree();
  });

  const top = document.createElement("div");
  top.className = "node-top";

  const toggle = document.createElement("button");
  toggle.className = "toggle-button";
  toggle.type = "button";
  toggle.textContent = node.children.length ? (node.collapsed ? "+" : "−") : "・";
  toggle.title = "開閉";
  toggle.addEventListener("click", event => {
    event.stopPropagation();
    if (!node.children.length) return;
    node.collapsed = !node.collapsed;
    saveData();
    renderTree();
  });

  const heading = document.createElement("h3");
  heading.className = "node-heading";
  heading.textContent = node.heading || "無題のメモ";

  top.append(toggle, heading);
  card.appendChild(top);

  if (node.content) {
    const content = document.createElement("p");
    content.className = "node-content";
    content.textContent = node.content.length > 140 ? `${node.content.slice(0, 140)}...` : node.content;
    card.appendChild(content);
  }

  const cardActions = document.createElement("div");
  cardActions.className = "card-actions";

  const addBranchButton = document.createElement("button");
  addBranchButton.className = "branch-button";
  addBranchButton.type = "button";
  addBranchButton.textContent = "＋枝を追加";
  addBranchButton.addEventListener("click", event => {
    event.stopPropagation();
    addChildToNode(node.id);
  });

  cardActions.appendChild(addBranchButton);
  card.appendChild(cardActions);

  item.appendChild(card);

  if (!node.collapsed && node.children.length) {
    const childList = document.createElement("ul");
    node.children.forEach(child => childList.appendChild(renderNode(child)));
    item.appendChild(childList);
  }

  return item;
}

function createNewMemo(heading = "新しいメモ") {
  return {
    id: crypto.randomUUID(),
    heading,
    content: "",
    collapsed: false,
    children: []
  };
}

function addChildToNode(nodeId) {
  const target = findNode(nodeId)?.node;
  if (!target) return;

  const child = createNewMemo("枝分かれしたメモ");
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

  const sibling = createNewMemo("同じ階層のメモ");
  found.parent.children.push(sibling);
  selectedId = sibling.id;
  saveData();
  renderTree();
}

function deleteSelected() {
  const found = findNode(selectedId);
  if (!found?.parent) return;

  const ok = confirm(`「${found.node.heading || "無題のメモ"}」を削除しますか？`);
  if (!ok) return;

  found.parent.children = found.parent.children.filter(child => child.id !== selectedId);
  selectedId = found.parent.id;
  saveData();
  renderTree();
}

function updateSelectedFromEditor() {
  const selectedNode = getSelectedNode();
  selectedNode.heading = headingInput.value.trim() || "無題のメモ";
  selectedNode.content = contentInput.value.trim();
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
      data = normalizeNode(JSON.parse(reader.result));
      selectedId = data.id;
      saveData();
      renderTree();
    } catch {
      alert("読み込めるJSON形式ではありません。保存したメモJSONを選んでください。");
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
  const ok = confirm("現在の内容を初期状態に戻しますか？必要な場合は先にJSON保存してください。");
  if (!ok) return;

  data = clone(initialData);
  selectedId = data.id;
  saveData();
  renderTree();
}

[headingInput, contentInput].forEach(input => {
  input.addEventListener("input", updateSelectedFromEditor);
});

addChildButton.addEventListener("click", addChild);
addSiblingButton.addEventListener("click", addSibling);
deleteButton.addEventListener("click", deleteSelected);
exportButton.addEventListener("click", exportJson);
importInput.addEventListener("change", importJson);
resetTemplateButton.addEventListener("click", resetTemplate);
expandAllButton.addEventListener("click", () => {
  allCollapsed = !allCollapsed;
  setCollapsedState(data, allCollapsed);
  saveData();
  renderTree();
});

saveData();
renderTree();
