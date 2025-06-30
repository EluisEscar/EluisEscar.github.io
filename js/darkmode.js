const switchInput = document.getElementById('darkModeSwitch');
  if (localStorage.getItem('dark-mode') === 'true') {
    document.body.classList.add('dark-mode');
    if(switchInput) switchInput.checked = true;
  }
  if(switchInput) {
    switchInput.addEventListener('change', function() {
      document.body.classList.toggle('dark-mode', this.checked);
      localStorage.setItem('dark-mode', this.checked);
    });
  }