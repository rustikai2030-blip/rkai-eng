import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase.js";

export async function openAdminPanel() {
  // Создаем или находим модальное окно для админки
  let adminModal = document.getElementById('admin-modal');
  if (!adminModal) {
    adminModal = document.createElement('div');
    adminModal.id = 'admin-modal';
    adminModal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); color: #fff; padding: 20px; box-sizing: border-box; overflow-y: auto; text-align: left; z-index: 2000; font-family: sans-serif;';
    adminModal.innerHTML = `
      <div style="max-width: 800px; margin: 30px auto; background: #1e1e24; padding: 20px; border-radius: 8px; border: 1px solid #333;">
        <button id="close-admin" style="float: right; padding: 6px 12px; background: #ff4d4d; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">✕ Закрыть</button>
        <h2 style="margin-top: 0; color: #c084fc;">🛠 Админ-панель: Мониторинг сессий</h2>
        <p style="color: #9ca3af; font-size: 14px; margin-bottom: 20px;">Логирование активности пользователей из базы данных Firestore.</p>
        <div id="admin-sessions-list" style="overflow-x: auto;">
          <p>Загрузка данных сессий...</p>
        </div>
      </div>
    `;
    document.body.appendChild(adminModal);

    document.getElementById('close-admin').onclick = () => {
      adminModal.style.display = 'none';
    };
  }

  adminModal.style.display = 'block';
  const container = document.getElementById('admin-sessions-list');
  container.innerHTML = '<p>Загрузка данных сессий...</p>';

  try {
    // Получаем последние 20 сессий, отсортированные по времени
    const q = query(collection(db, "sessions"), orderBy("timestamp", "desc"), limit(20));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = '<p style="color: #f3f4f6;">Пока нет сохраненных сессий в базе данных.</p>';
      return;
    }

    let tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid #4b5563; color: #9ca3af;">
            <th style="padding: 10px;">Пользователь</th>
            <th style="padding: 10px;">Верно</th>
            <th style="padding: 10px;">Ошибки</th>
            <th style="padding: 10px;">Время</th>
            <th style="padding: 10px;">Дата / Время сессии</th>
          </tr>
        </thead>
        <tbody>
    `;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const dateStr = data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : 'Только что';
      const durationMins = Math.floor((data.durationSeconds || 0) / 60);
      const durationSecs = (data.durationSeconds || 0) % 60;
      const timeFormatted = `${durationMins}м ${durationSecs}с`;

      tableHtml += `
        <tr style="border-bottom: 1px solid #374151;">
          <td style="padding: 10px; color: #f3f4f6; word-break: break-all;">${data.email || 'Аноним'}</td>
          <td style="padding: 10px; color: #4ade80; font-weight: bold;">${data.correctAnswers || 0}</td>
          <td style="padding: 10px; color: #f87171; font-weight: bold;">${data.incorrectAnswers || 0}</td>
          <td style="padding: 10px;">${timeFormatted}</td>
          <td style="padding: 10px; color: #9ca3af; font-size: 12px;">${dateStr}</td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;

  } catch (error) {
    console.error("Ошибка загрузки сессий:", error);
    container.innerHTML = `<p style="color: #f87171;">Ошибка при загрузке данных: ${error.message}</p>`;
  }
}