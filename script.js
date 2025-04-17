const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.background = "#e6f7ff";
});

dropZone.addEventListener('dragleave', () => {
  dropZone.style.background = "";
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  fileInput.files = e.dataTransfer.files;
  dropZone.innerText = fileInput.files[0].name;
});

fileInput.addEventListener('change', () => {
  dropZone.innerText = fileInput.files[0].name;
});

async function uploadFile() {
  const file = fileInput.files[0];
  const fileName = document.getElementById('fileName').value.trim();
  const repo = document.getElementById('repo').value.trim();
  const branch = document.getElementById('branch').value.trim() || 'main';
  const token = document.getElementById('token').value.trim();
  const resultDiv = document.getElementById('result');

  if (!file || !fileName || !repo || !token) {
    alert('Isi semua form dengan benar');
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1];
    const path = `iklan/${fileName}`;
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `upload ${fileName}`,
        content: base64,
        branch: branch
      })
    });

    const data = await res.json();

    if (res.ok) {
      const fileUrl = `https://${repo.split('/')[0]}.github.io/iklan/${fileName}`;
      resultDiv.innerHTML = `<p><strong>Berhasil upload!</strong></p><a href="${fileUrl}" target="_blank">${fileUrl}</a>`;
    } else {
      resultDiv.innerHTML = `<p style="color:red;">Gagal upload: ${data.message}</p>`;
    }
  };
  reader.readAsDataURL(file);
}
