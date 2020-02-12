const minimist = require('minimist');
const timestamp = Math.floor(Date.now() / 1000);
var fs = require('fs');



console.log("Load Testing @ ", timestamp);
let args = minimist(process.argv.slice(1), {
  default: {
    t: 1
  }
});

console.log('args:', args);

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

const puppeteer = require('puppeteer');
var options = {
  headless: true,
  args: [

    '--use-fake-device-for-media-stream',
    '--no-sandbox',
    '--use-file-for-fake-video-capture=./video/newfile.mjpeg',
    '--disable-infobars',
    '--disable-web-security',
    '--use-fake-ui-for-media-stream',
    '--disable-infobars',
    '--no-sandbox',
    '--disable-web-security',
    '--user-data-dir="/"',
    '--user-data-dir="/"',
    '--ignore-certificate-errors',
    '--allow-file-access',
    '--unsafely-treat-insecure-origin-as-secure',
    '--start-maximized'
  ],
  executablePath: "/usr/bin/google-chrome-unstable"
};



(async () => {
  const browser = await puppeteer.launch(options);

  var dir = 'logs/' + timestamp;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  var imgdir = 'logs/' + timestamp + '/screenshots';

  if (!fs.existsSync(imgdir)) {
    fs.mkdirSync(imgdir);
  }

  var firstPeerStream = fs.createWriteStream('logs/' + timestamp + '/' + '_peer1.log');
  await sleep(5000);
  var firstPeer = await browser.newPage();
  await createFirstPeer(browser, firstPeer, 'http://localhost:8443/', firstPeerStream);
  await browser.close();
})();


async function createFirstPeer(browser, page, url, stream) {
  await page.waitFor(10000);

  page.on('pageerror', error => {
    console.log("First Peer:", error.message);
    stream.write("First Peer:", error.message + "\n");
  });

  page.on('requestfailed', request => {
    console.log("First Peer:", request.failure().errorText, request.url);
    stream.write("First Peer:", request.failure().errorText, request.url + "\n");

  });

  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i){
      console.log(`First Peer: ${i}: ${msg.args()[i]}\n`);
      stream.write(`First Peer: ${i}: ${msg.args()[i]}\n`);
    }

  });



  await page.setViewport({
    width: 1920,
    height: 1080
  });
  await page.goto(url, {
    waitUntil: 'networkidle2'
  });
  await page.waitFor(10000);

  await page.evaluate(() => {
    document.querySelector('#join-dialog button').click();
  });
  await page.waitFor(10000);

  await page.waitForSelector('#copy-input', {
    visible: true,
    timeout: 0
  })
  await page.waitFor(2000);

  var roomLink = await page.evaluate(() => {
    roomLink = document.querySelector('#copy-input').value;
    return Promise.resolve(roomLink);
  });

  console.log(roomLink);
  var secondPeerStream = fs.createWriteStream('logs/' + timestamp + '/' + '_peer2.log');
  var secondPeer = await browser.newPage();
  await page.waitFor(10000);

  await createSecondPeer(secondPeer, roomLink, secondPeerStream);
  await page.screenshot({
    path: 'logs/' + timestamp + '/screenshots/' + 'screenshot_1.png',
    fullPage: true
  });

}


async function createSecondPeer(page, url, stream) {


  page.on('pageerror', error => {
    console.log("Second Peer", error.message + "\n");
    stream.write("Second Peer", error.message + "\n");

  });

  page.on('requestfailed', request => {
    console.log("Second Peer", request.failure().errorText, request.url);
    stream.write("Second Peer", request.failure().errorText, request.url + "\n");

  });
  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i){
      console.log(`Second Peer: ${i}: ${msg.args()[i]}+\n`);
      stream.write(`Second Peer: ${i}: ${msg.args()[i]}+\n`);

    }
  });


  await page.setViewport({
    width: 1920,
    height: 1080
  });
  await page.waitFor(5000);

  await page.goto(url, {
    waitUntil: 'networkidle2'
  });


  if (args.t > 1) {
    await page.waitFor(args.t * 60 * 1000);
    await page.screenshot({
      path: 'logs/' + timestamp + '/screenshots/' + 'screenshot_2.png',
      fullPage: true
    });

  } else {
    await page.waitFor(args.t * 60 * 1000);
    await page.screenshot({
      path: 'logs/' + timestamp + '/screenshots/' + 'screenshot_2.png',
      fullPage: true
    });
  }


  return Promise.resolve();


}