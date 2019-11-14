const root =
  document.querySelector('#root') ||
  document.body.appendChild(document.createElement('div'));
root.id = 'root';

root.innerHTML = 'Second: The JavaScript works!';
