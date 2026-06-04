const STORAGE_KEY = "simple-heading-content-memos";

let memos = loadMemos();
let editingId = null;

const headingInput = document.getElementById("headingInput");
const contentInput = document.getElementById("contentInput");
const addMemoButton = document.getElementById("addMemoButton");
const saveMemoButton = document.getElementById("saveMemoButton");
const clearEditorButton = document.getElementById("clearEditorButton");
const memoList = document.getElementById("memoList");

function loadMemos() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveMemos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
}

function createMemo() {
  return {
    id: crypto.randomUUID(),
    heading: headingInput.value,
    content: contentInput.value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function clearEditor() {
  editingId = null;
  headingInput.value = "";
  contentInput.value = "";
  saveMemoButton.textContent = "保存";
  headingInput.focus();
}

function saveCurrentMemo() {
  const heading = headingInput.value;
  const content = contentInput.value;

  if (editingId) {
    memos = memos.map(memo => {
      if (memo.id !== editingId) return memo;
      return {
        ...memo,
        heading,
        content,
        updatedAt: new Date().toISOString()
      };
    });
  } else {
    memos.unshift(createMemo());
  }

  saveMemos();
  clearEditor();
  renderMemos();
}

function editMemo(id) {
  const memo = memos.find(item => item.id === id);
  if (!memo) return;

  editingId = id;
  headingInput.value = memo.heading;
  contentInput.value = memo.content;
  saveMemoButton.textContent = "更新";
  headingInput.focus();
}

function deleteMemo(id) {
  const ok = confirm("このメモを削除しますか？");
  if (!ok) return;

  memos = memos.filter(memo => memo.id !== id);
  if (editingId === id) clearEditor();
  saveMemos();
  renderMemos();
}

function renderMemos() {
  memoList.innerHTML = "";

  if (memos.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-message";
    empty.textContent = "まだメモがありません。";
    memoList.appendChild(empty);
    return;
  }

  memos.forEach(memo => {
    const card = document.createElement("article");
    card.className = "memo-card";

    const title = document.createElement("h3");
    title.textContent = memo.heading || "無題";

    const body = document.createElement("p");
    body.textContent = memo.content || "内容なし";

    const actions = document.createElement("div");
    actions.className = "memo-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "secondary";
    editButton.textContent = "編集";
    editButton.addEventListener("click", () => editMemo(memo.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "削除";
    deleteButton.addEventListener("click", () => deleteMemo(memo.id));

    actions.append(editButton, deleteButton);
    card.append(title, body, actions);
    memoList.appendChild(card);
  });
}

addMemoButton.addEventListener("click", clearEditor);
saveMemoButton.addEventListener("click", saveCurrentMemo);
clearEditorButton.addEventListener("click", clearEditor);

renderMemos();
