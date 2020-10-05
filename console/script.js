const consoleDiv = document.getElementById('console');


// GLOBAL VARIABLES (for now)
let canType = true;
let bufferId = 0;
let currentBuffer = document.createElement('span'); // for autocomplete

// commands

const makeApiRequest = async (uri) => {
  const url = `https://api.github.com/${uri}`;
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  return await fetch(url, { headers }).then(res => res.json());
}

const lsCommand = async (...args) => {
  const response = await makeApiRequest('users/wassim-saadallah/repos');
  return response.map(({ name, contents_url, created_at, updated_at, html_url }) => ({
    name, contents_url, created_at, updated_at, html_url
  }));
}

const commands = {
  'ls': lsCommand,
}

const runCommand = async (command = '') => {

  // sanitize the arguments
  const args = command.trim().split(' ');
  const commandName = args.shift();
  for (let i = 0; i < args.length; i++) {
    if (args[i].trim() === '') args.splice(i);
  }
  return { commandName, result: await commands[commandName](...args) };
}

// /commands

const createCursor = () => {
  const cursor = document.createElement('span');
  cursor.classList.add('cursorSpan');
  cursor.innerText = '█'
  consoleDiv.appendChild(cursor);
}

const createBuffer = (first = false) => {
  // TODO: add styling to buffer
  const buffer = document.createElement('span');
  buffer.id = bufferId++;
  currentBuffer = buffer;
  if (!first) {
    consoleDiv.insertBefore(buffer, consoleDiv.children[consoleDiv.childElementCount - 1]);
  } else {
    consoleDiv.appendChild(buffer);
  }
}

// hack cause how the fuck would you know if a character
// is printable if you don't know what the fuck is the key code from
// charCodeAt()
const isPrintable = (key) => (key.length === 1);

const renderPrompt = (first = false) => {
  // TODO: Add style to prompt
  const promptSpan = document.createElement('span');
  promptSpan.innerText = 'github> ';
  if (!first) {
    consoleDiv.insertBefore(promptSpan, consoleDiv.children[consoleDiv.childElementCount - 1]);
  } else {
    consoleDiv.appendChild(promptSpan);
  }
  createBuffer(first)
}

const renderLSTree = (result) => {
  // console.log(await result);
  const pre = document.createElement('pre');
  pre.innerText = JSON.stringify(result, null, 2);
  pre.classList.add('lsResult');
  return pre;
}

const renderResult = ({ result, commandName }, cb) => {
  let node = document.createElement('span'); // for intellisense (typescript will have a type)
  if (commandName === 'ls') {
    // TODO : add error handling
    node = renderLSTree(result);
    console.log(node);
  }
  consoleDiv.insertBefore(node, consoleDiv.children[consoleDiv.childElementCount - 1]);

}

document.addEventListener('keydown', (ev) => {
  if (!canType) return;
  if (isPrintable(ev.key)) {
    currentBuffer.innerText += ev.key;
  }
  if (ev.key === 'Backspace') {
    const buf = currentBuffer.innerText;
    if (ev.ctrlKey) {
      const end = buf.lastIndexOf(' ') !== -1 ? buf.lastIndexOf(' ') : buf.length - 1;
      currentBuffer.innerText = buf.slice(0, end);
    } else {
      currentBuffer.innerText = buf.slice(0, buf.length - 1);
    }
  }
  if (ev.key === 'Enter') {
    const command = currentBuffer.innerText;
    console.log('Execute command : ' + command);
    // TODO : THIS IS A HACK, i need a way to make sure that the result is rendered before  the prompt rerenders
    runCommand(command).then(commandResult => {
      console.log(commandResult);
      renderResult(commandResult);
      // settimeout to make the prompt render after the results renders completely
      // https://stackoverflow.com/questions/15875128/how-to-tell-when-a-dynamically-created-element-has-rendered
      // TODO : use a MutationObserver
      setTimeout(() => {
        renderPrompt(false);
      });
    });
  }
});


// IIFE as a main function

(function main() {
  renderPrompt(true);
  createCursor();
})();
