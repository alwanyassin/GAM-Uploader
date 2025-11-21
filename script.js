const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.querySelector('button[onclick="uploadFile()"]'); // Select button explicitly

// Load settings from LocalStorage on startup
window.addEventListener('DOMContentLoaded', () => {
  const savedRepo = localStorage.getItem('gam_repo');
  const savedBranch = localStorage.getItem('gam_branch');
  const savedToken = localStorage.getItem('gam_token');

  if (savedRepo) document.getElementById('repo').value = savedRepo;
  if (savedBranch) document.getElementById('branch').value = savedBranch;
  if (savedToken) document.getElementById('token').value = savedToken;
});

// Save settings when inputs change
['repo', 'branch', 'token'].forEach(id => {
  document.getElementById(id).addEventListener('change', (e) => {
    localStorage.setItem(`gam_${id}`, e.target.value.trim());
  });
});

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.background = "#e6f7ff";
});

dropZone.addEventListener('dragleave', () => {
  dropZone.style.background = "";
});

function setAutoFileName(file) {
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Mohon upload file gambar saja (JPG, PNG, GIF, dll).');
    return;
  }

  const originalName = file.name;
  // Replace spaces and special chars with dash, keep extension
  const cleanName = originalName.replace(/[^a-zA-Z0-9.]/g, '-').toLowerCase(); 
  document.getElementById('fileName').value = cleanName;
  
  // Update dropzone text
  const dzText = dropZone.querySelector('p');
  if(dzText) dzText.innerText = `File terpilih: ${cleanName}`;
  
  dropZone.style.borderColor = "#2563eb";
  dropZone.style.background = "#eff6ff";
}

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.background = "";
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
    alert('Mohon lengkapi semua field (File, Nama, Repo, Token)');
    return;
  }

  // Save settings explicitly before upload to be sure
  localStorage.setItem('gam_repo', repo);
  localStorage.setItem('gam_branch', branch);
  localStorage.setItem('gam_token', token);

  // Loading State
  const originalBtnContent = uploadBtn.innerHTML;
  uploadBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> <span>Sedang Mengupload...</span>';
  uploadBtn.disabled = true;
  uploadBtn.style.opacity = "0.7";
  uploadBtn.style.cursor = "not-allowed";
  resultDiv.innerHTML = ''; // Clear previous result

  try {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
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
            message: `upload ${fileName} via GAM Uploader`,
            content: base64,
            branch: branch
          })
        });

        const data = await res.json();

        if (res.ok) {
          const repoName = repo.split('/')[1];
          const repoOwner = repo.split('/')[0];
          // Construct GitHub Pages URL (assuming standard pattern)
          const fileUrl = `https://${repoOwner}.github.io/${repoName}/iklan/${fileName}`;
          
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
            <div class="result-card">
                <div class="success-header">
                  <i class="ph ph-check-circle" style="font-size: 1.5rem;"></i>
                  <span>Upload Berhasil!</span>
                </div>
                
                <div class="input-group">
                  <label>Script HTML Iklan:</label>
                  <div class="code-block">
                    <textarea id="outputScript" readonly>${htmlOutput}</textarea>
                    <button onclick="copyToClipboard()" class="btn-copy">
                      <i class="ph ph-copy"></i> Salin Code
                    </button>
                  </div>
                </div>
                
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
                  <i class="ph ph-info"></i> Pastikan GitHub Pages sudah aktif di repo ini.
                </p>
            </div>
          `;
        } else {
          throw new Error(data.message || 'Gagal upload ke GitHub');
        }
      } catch (err) {
        alert(`Error: ${err.message}`);
        console.error(err);
      } finally {
        // Reset Button State
        uploadBtn.innerHTML = '<i class="ph ph-paper-plane-right"></i> <span>Upload ke GitHub</span>';
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = "1";
        uploadBtn.style.cursor = "pointer";
      }
    };
    reader.readAsDataURL(file);
    
  } catch (error) {
    alert('Terjadi kesalahan saat memproses file.');
    console.error(error);
    uploadBtn.innerHTML = '<i class="ph ph-paper-plane-right"></i> <span>Upload ke GitHub</span>';
    uploadBtn.disabled = false;
    uploadBtn.style.opacity = "1";
    uploadBtn.style.cursor = "pointer";
  }
}

function copyToClipboard() {
  const outputTextarea = document.getElementById('outputScript');
  
  // Modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(outputTextarea.value)
      .then(() => showSnackbar())
      .catch(err => {
        console.error('Gagal copy:', err);
        fallbackCopy(outputTextarea);
      });
  } else {
    fallbackCopy(outputTextarea);
  }
}

function fallbackCopy(element) {
  element.select();
  element.setSelectionRange(0, 99999);
  document.execCommand('copy');
  showSnackbar();
}

function showSnackbar() {
  const snackbar = document.getElementById('snackbar');
  snackbar.classList.add('show');
  setTimeout(() => {
    snackbar.classList.remove('show');
  }, 3000);
}

