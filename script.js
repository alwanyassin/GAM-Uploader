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

function setAutoFileName(file) {
  const originalName = file.name;
  const cleanName = originalName.replace(/\s+/g, '-'); // ganti spasi dengan strip
  document.getElementById('fileName').value = cleanName;
  dropZone.innerText = cleanName;
}

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  fileInput.files = e.dataTransfer.files;
  setAutoFileName(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  setAutoFileName(file);
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
    const repoName = repo.split('/')[1];
    const fileUrl = `https://${repo.split('/')[0]}.github.io/${repoName}/iklan/${fileName}`;
    
    const selectedSize = document.getElementById('size').value;
    const [w, h] = selectedSize.split('x');

    const htmlOutput = `
    <div style="width: ${w}px; height: ${h}px; overflow: hidden;">
    <a href="%%CLICK_URL_UNESC%%(TAMBAH URL LANDING PAGE DI SINI)" target="_blank">
    <img 
        src="${fileUrl}"
        style="width: 100%; height: 100%; object-fit: cover; display: block;"
        alt="IKLAN">
    </a>
    </div>`.trim();

    resultDiv.innerHTML = `
        <p><strong>Script HTML Iklan Siap Pakai:</strong></p>
        <textarea id="outputScript" style="width: 100%; height: 200px;">${htmlOutput}</textarea>
        <button onclick="copyToClipboard()" style="margin-top: 10px;">Copy to Clipboard</button>
    `;
    }

  };
  reader.readAsDataURL(file);
}

function copyToClipboard() {
  const outputTextarea = document.getElementById('outputScript');
  outputTextarea.select();
  outputTextarea.setSelectionRange(0, 99999); // For mobile

  document.execCommand('copy');

  // Show snackbar
  const snackbar = document.getElementById('snackbar');
  snackbar.classList.add('show');

  setTimeout(() => {
    snackbar.classList.remove('show');
  }, 3000); // Hilang setelah 3 detik
}

