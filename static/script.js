// Wait until the typing animation is done (4s in this case)
setTimeout(() => {
  document.querySelector('.typewriter').classList.add('done');
}, 4000); 



const htmlEditor = CodeMirror.fromTextArea(document.getElementById("code-html"), {
  mode: "xml",
  theme: "material-ocean",
  lineNumbers: true,
  lineWrapping: true
});
const cssEditor = CodeMirror.fromTextArea(document.getElementById("code-css"), {
  mode: "css",
  theme: "material-ocean",
  lineNumbers: true,
  lineWrapping: true
});
const jsEditor = CodeMirror.fromTextArea(document.getElementById("code-js"), {
  mode: "javascript",
  theme: "material-ocean",
  lineNumbers: true,
  lineWrapping: true
});

document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("theme-toggle");

  // Load theme from localStorage
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }

  toggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");

    // Optionally change icon
    toggleButton.textContent = isDark ? "☀️" : "🌙";
  });
});

const tabs = document.querySelectorAll('[role="tab"]');
const panels = document.querySelectorAll('[role="tabpanel"]');

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.setAttribute("aria-selected", false));
    tab.setAttribute("aria-selected", true);

    panels.forEach(panel => panel.classList.remove("active"));
    document.getElementById(tab.getAttribute("aria-controls")).classList.add("active");

    setTimeout(() => {
      htmlEditor.refresh();
      cssEditor.refresh();
      jsEditor.refresh();
    }, 100);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('menu');

  // Toggle menu when hamburger is clicked
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent event bubbling
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  });
// Close menu when clicking anywhere else
  document.addEventListener('click', (e) => {
    // If menu is open and click is outside both menu and hamburger
    if (menu.style.display === 'block' &&
        !menu.contains(e.target) &&
        !hamburger.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
  });
// New File button logic
document.getElementById('newFileBtn').addEventListener('click', () => {
    htmlEditor.setValue('');
    cssEditor.setValue('');
    jsEditor.setValue('');
    document.getElementById('saveName').value = '';
    document.getElementById('loadSelect').value = '';
    document.getElementById('deleteBtn').disabled = true;
});


document.getElementById("runBtn").addEventListener("click", () => {
    const html = htmlEditor.getValue();
    const css = `<style>${cssEditor.getValue()}</style>`;
    const js = `<script>${jsEditor.getValue()}<\/script>`;
    const output = html + css + js;
    document.getElementById("preview-frame").srcdoc = output;
});
function updatePreview() {
  const html = htmlEditor.getValue();
  const css = `<style>${cssEditor.getValue()}</style>`;
  const js = `<script>${jsEditor.getValue()}<\/script>`;
  const output = html + css + js;
  document.getElementById("preview-frame").srcdoc = output;
}

// Trigger update when Run button is clicked (still optional)
document.getElementById("runBtn").addEventListener("click", updatePreview);

// Also trigger on editor input/change
htmlEditor.on("change", updatePreview);
cssEditor.on("change", updatePreview);
jsEditor.on("change", updatePreview);

document.getElementById("saveBtn").addEventListener("click", () => {
    const name = document.getElementById("saveName").value.trim();
    if (!name) return alert("Please enter a project name.");
    const project = {
        html: htmlEditor.getValue(),
        css: cssEditor.getValue(),
        js: jsEditor.getValue()
    };
    localStorage.setItem(name, JSON.stringify(project));
    updateLoadOptions();
    alert("Project saved!");
});
function loadProjects() {
  const select = document.getElementById("loadSelect");
  select.innerHTML = '<option disabled selected>Load Project</option>'; // Reset

  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    select.appendChild(option);
  });
}
window.onload = loadProjects;
function updateLoadOptions() {
    const select = document.getElementById("loadSelect");
    select.innerHTML = '<option value="" disabled selected>Load Project...</option>';
    Object.keys(localStorage).forEach(key => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = key;
        select.appendChild(opt);
    });
}
// Initialize project load dropdown on page load
updateLoadOptions();

document.getElementById("loadSelect").addEventListener("change", (e) => {
    const project = JSON.parse(localStorage.getItem(e.target.value));
    if (project) {
        htmlEditor.setValue(project.html);
        cssEditor.setValue(project.css);
        jsEditor.setValue(project.js);
        document.getElementById("saveName").value = e.target.value;
        document.getElementById("deleteBtn").disabled = false;
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const deleteBtn = document.getElementById("deleteBtn");
    const exportBtn = document.getElementById("exportBtn");

    deleteBtn.addEventListener("click", () => {
        const name = document.getElementById("loadSelect").value;
        if (!name) return;
        if (confirm(`Delete project "${name}"?`)) {
            localStorage.removeItem(name);
            updateLoadOptions();
            htmlEditor.setValue('');
            cssEditor.setValue('');
            jsEditor.setValue('');
            document.getElementById("saveName").value = '';
            deleteBtn.disabled = true;
        }
    });
    document.addEventListener("DOMContentLoaded", () => {
  const deleteBtn = document.getElementById("deleteBtn");
  const loadSelect = document.getElementById("loadSelect");

  // Enable the button when a project is selected
  loadSelect.addEventListener("change", () => {
    deleteBtn.disabled = !loadSelect.value;
  });

  deleteBtn.addEventListener("click", () => {
    const projectName = loadSelect.value;
    if (!projectName) return;

    if (confirm(`Are you sure you want to delete "${projectName}"?`)) {
      fetch('/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: projectName })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(`"${projectName}" deleted successfully.`);
          loadSelect.value = '';
          document.getElementById("saveName").value = '';
          deleteBtn.disabled = true;

          // Optional: Refresh dropdown
          updateLoadOptions(); 
        } else {
          alert("Failed to delete project.");
        }
      })
      .catch(error => {
        console.error("Error deleting project:", error);
        alert("An error occurred while deleting the project.");
      });
    }
  });
});


   document.getElementById('exportBtn').addEventListener('click', () => {
    const html = htmlEditor.getValue().trim();
    const css = cssEditor.getValue().trim();
    const js = jsEditor.getValue().trim();

    const projectNameInput = document.getElementById('saveName').value.trim();
    const baseName = projectNameInput !== '' ? projectNameInput : 'project';

    let downloadedFiles = [];

    if (html) {
        downloadFile(`${baseName}.html`, html);
        downloadedFiles.push(`${baseName}.html`);
    }
    if (css) {
        downloadFile(`${baseName}.css`, css);
        downloadedFiles.push(`${baseName}.css`);
    }
    if (js) {
        downloadFile(`${baseName}.js`, js);
        downloadedFiles.push(`${baseName}.js`);
    }

    if (downloadedFiles.length > 0) {
        alert(`Files downloaded: ${downloadedFiles.join(', ')}`);
    } else {
        alert("No code to export. All editors are empty.");
    }
});


  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}
});

// Show editor & hide home when start clicked
document.getElementById('startBtn').addEventListener('click', () => {
    document.getElementById('home').style.display = 'none';
    document.querySelector('.container').style.display = 'flex';
    setTimeout(() => {
      htmlEditor.refresh();
      cssEditor.refresh();
      jsEditor.refresh();
    }, 100);

});

// Initially hide editor container on page load
document.querySelector('.container').style.display = 'none';



  


