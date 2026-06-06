'use strict';
const addButton = document.getElementById('add-task-button');
const taskInput = document.getElementById('new-task-input');
const lists = document.querySelectorAll('.task-list');
let draggedItem = null;

// --- 1. カラムのドラッグ＆ドロップイベント設定 ---
lists.forEach(list => {
  // ドラッグが重なっている間のデフォルト挙動をリセット
  list.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  // ドラッグ要素がカラムに入った時の見た目の処理
  list.addEventListener('dragenter', () => list.classList.add('drag-over'));
  list.addEventListener('dragleave', () => list.classList.remove('drag-over'));

  // ドロップされた時の処理
  list.addEventListener('drop', async () => {
    list.classList.remove('drag-over');
    
    if (draggedItem) {
      list.appendChild(draggedItem);

      // 移動先のカラムIDからステータスを決定 (例: todo-list -> todo)
      const newStatus = list.id.replace('-list', '');
      
      // 完了(done)の場合は打消し線を入れ、それ以外は外す
      if (newStatus === 'done') {
        draggedItem.classList.add('completed');
      } else {
        draggedItem.classList.remove('completed');
      }
      
      // データベース上のステータスを更新する（サーバーへ通信）
      const taskId = draggedItem.getAttribute('data-id');
      try {
        await fetch('/posts/updateStatus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `id=${taskId}&status=${newStatus}`
        });
      } catch (err) {
        console.error('タスクの状態更新に失敗しました:', err);
      }
    }
  });
});

// --- 2. 新しいタスクの追加ボタンの処理 ---
addButton.addEventListener('click', async () => {
  const text = taskInput.value.trim();
  if (text !== "") {
    try {
      // サーバーの /posts（POST）にデータを送信
      await fetch('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `content=${encodeURIComponent(text)}`
      });
      
      // 保存が成功したらリロードして最新の状態で表示
      window.location.reload();
    } catch (err) {
      console.error('タスクの追加に失敗しました:', err);
    }
  }
});

// --- 3. 最初から画面にあるタスクへのイベント付与（リロード対策） ---
const allTasks = document.querySelectorAll('.task');
allTasks.forEach(task => {
  // ドラッグ開始
  task.addEventListener('dragstart', () => {
    draggedItem = task;
    // タイミングをずらして半透明にするなど（任意）
    setTimeout(() => task.classList.add('dragging'), 0);
  });

  // ドラッグ終了
  task.addEventListener('dragend', () => {
    task.classList.remove('dragging');
    draggedItem = null;
  });

  // ダブルクリックで削除処理
  task.addEventListener('dblclick', async () => {
    const confirmDelete = confirm(`「${task.textContent}」のタスクを削除しますか？`);
    if (confirmDelete) {
      const taskId = task.getAttribute('data-id');
      try {
        // サーバーの /posts/delete にIDを送信
        await fetch('/posts/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `id=${taskId}`
        });
        // 画面から要素を消す
        task.remove();
      } catch (err) {
        console.error('タスクの削除に失敗しました:', err);
      }
    }
  });
});