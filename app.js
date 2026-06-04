const STORAGE_KEY = "career-self-analysis-tree-v1";

const templateData = {
  id: crypto.randomUUID(),
  title: "自己分析",
  tags: ["就活", "自己分析"],
  body: "自分の経験・強み・価値観を要素分解して整理するトップメモです。",
  collapsed: false,
  children: [
    {
      id: crypto.randomUUID(),
      title: "経験",
      tags: ["事実"],
      body: "サークル、授業、アルバイト、研究、インターンなどの経験を書き出す。",
      collapsed: false,
      children: [
        {
          id: crypto.randomUUID(),
          title: "アカペラサークル運営改革",
          tags: ["幹部", "課題解決"],
          body: "約100名規模の組織で、会議や資料共有の仕組みを整えた経験。",
          collapsed: false,
          children: []
        },
        {
          id: crypto.randomUUID(),
          title: "合宿幹事",
          tags: ["巻き込み", "企画"],
          body: "参加費や交流機会の課題に対して、低コストで学年を越えた企画を行った経験。",
          collapsed: false,
          children: []
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      title: "強み",
      tags: ["自己PR"],
      body: "自分がどのような場面で価値を出せるかを分解する。",
      collapsed: false,
      children: [
        {
          id: crypto.randomUUID(),
          title: "周囲が本質的な活動に集中できる環境を整える力",
          tags: ["仕組み化", "改善"],
          body: "業務や情報を整理し、チームが創造的な議論に時間を使えるようにする。",
          collapsed: false,
          children: []
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      title: "価値観",
      tags: ["就活軸"],
      body: "働くうえで大切にしたいこと、避けたいこと、やりがいを感じる瞬間を書く。",
      collapsed: false,
      children: [
        {
          id: crypto.randomUUID(),
          title: "チームで課題解決すること",
          tags: ["協働", "SIer"],
          body: "一人で完結するより、周囲を巻き込みながら課題を解決する仕事に惹かれる。",
          collapsed: false,
          children: []
        }
      ]
    }
  ]
};

let data = loadData();
let selectedId = data.id;
let allCollapsed = false;

const treeContainer = document.getElementById("treeContainer");
const titleInput = document.getElementById("titleInput");
const tagInput = document.getElementById("tagInput");
const bodyInput = document.getElementById("bodyInput");
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

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return clone(templateData);

  try {
    return JSON.parse(saved);
  } catch {
    return clone(templateData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  saveStatus.textContent = "自動保存済み";
}

function findNode(id, node = data, parent = null) {
  if (node.id === id) return { node, parent };
  for (const child of node.children || []) {
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
  titleInput.value = selectedNode.title || "";
  tagInput.value = (selectedNode.tags || []).join(", ");
  bodyInput.value = selectedNode.body || "";
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

  const card = document.createElement("button");
  card.className = `node-card ${node.id === selectedId ? "selected" : ""}`;
  card.type = "button";
  card.addEventListener("click", () => {
    selectedId = node.id;
    renderTree();
  });

  const top = document.createElement("div");
  top.className = "node-top";

  const toggle = document.createElement("span");
  toggle.className = "toggle-button";
  toggle.textContent = node.children?.length ? (node.collapsed ? "+" : "−") : "・";
  toggle.addEventListener("click", event => {
    event.stopPropagation();
    if (!node.children?.length) return;
    node.collapsed = !node.collapsed;
    saveData();
    renderTree();
  });

  const title = document.createElement("span");
  title.className = "node-title";
  title.textContent = node.title || "無題のメモ";

  top.append(toggle, title);
  card.appendChild(top);

  if (node.body) {
    const body = document.createElement("p");
    body.className = "node-body";
    body.textContent = node.body.length > 120 ? `${node.body.slice(0, 120)}...` : node.body;
    card.appendChild(body);
  }

  if (node.tags?.length) {
    const tagWrap = document.createElement("div");
    tagWrap.className = "node-tags";
    node.tags.forEach(tag => {
      const tagEl = document.createElement("span");
      tagEl.className = "node-tag";
      tagEl.textContent = tag;
      tagWrap.appendChild(tagEl);
    });
    card.appendChild(tagWrap);
  }

  item.appendChild(card);

  if (!node.collapsed && node.children?.length) {
    const childList = document.createElement("ul");
    node.children.forEach(child => childList.appendChild(renderNode(child)));
    item.appendChild(childList);
  }

  return item;
}

function createNewNode(title = "新しい要素") {
  return {
    id: crypto.randomUUID(),
    title,
    tags: [],
    body: "",
    collapsed: false,
    children: []
  };
}

function addChild() {
  const selectedNode = getSelectedNode();
  selectedNode.children ||= [];
  const child = createNewNode("下位要素");
  selectedNode.children.push(child);
  selectedNode.collapsed = false;
  selectedId = child.id;
  saveData();
  renderTree();
}

function addSibling() {
  const found = findNode(selectedId);
  if (!found?.parent) {
    addChild();
    return;
  }
  const sibling = createNewNode("同階層の要素");
  found.parent.children.push(sibling);
  selectedId = sibling.id;
  saveData();
  renderTree();
}

function deleteSelected() {
  const found = findNode(selectedId);
  if (!found?.parent) return;

  const ok = confirm(`「${found.node.title || "無題のメモ"}」を削除しますか？`);
  if (!ok) return;

  found.parent.children = found.parent.children.filter(child => child.id !== selectedId);
  selectedId = found.parent.id;
  saveData();
  renderTree();
}

function updateSelectedFromEditor() {
  const selectedNode = getSelectedNode();
  selectedNode.title = titleInput.value.trim() || "無題のメモ";
  selectedNode.tags = tagInput.value
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
  selectedNode.body = bodyInput.value.trim();
  saveStatus.textContent = "保存中...";
  saveData();
  renderTree();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `career-self-analysis-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.id || !imported.title) throw new Error("invalid format");
      data = imported;
      selectedId = data.id;
      saveData();
      renderTree();
    } catch {
      alert("読み込めるJSON形式ではありません。保存した自己分析メモのJSONを選んでください。");
    } finally {
      importInput.value = "";
    }
  };
  reader.readAsText(file);
}

function setCollapsedState(node, collapsed) {
  node.collapsed = collapsed;
  node.children?.forEach(child => setCollapsedState(child, collapsed));
}

function resetTemplate() {
  const ok = confirm("現在の内容をテンプレートに戻しますか？必要な場合は先にJSON保存してください。");
  if (!ok) return;
  data = clone(templateData);
  selectedId = data.id;
  saveData();
  renderTree();
}

[titleInput, tagInput, bodyInput].forEach(input => {
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

renderTree();
