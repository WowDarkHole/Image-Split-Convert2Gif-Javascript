const GIFEncoder = require('gif-encoder-2')
const { createCanvas, Image } = require('canvas')
const { createWriteStream, readdir } = require('fs')
const { promisify } = require('util')
const path = require('path')
require('jszip');
require('file-saver');
require('gif-frames');


const readdirAsync = promisify(readdir)
const imagesFolder = path.join(__dirname, 'input')
const prefixInput = "Pre";

// split canvas section
const generatedPngFiles = [];

async function loadImages() {

  const files = await readdirAsync(imagesFolder)

  const [width, height] = await new Promise(resolve2 => {
    const image = new Image()
    image.onload = () => resolve2([image.width, image.height])
    image.src = path.join(imagesFolder, files[0])
  })

  console.log("Files: ", files)

  console.log("Width: ", width)
  console.log("Height: ", height)
  splitImages(width, height, files[0])
}

const toBlob = (d) => new Promise((res) => d.toBlob(res));

async function splitImages(width, height, file) {

  const size = 250;
  console.log("Working...");

  let str = '';
  let done = 0;
  let numTiles;
  const prefix = (prefixInput || file.name.replace(/\.\w+$/, '')).replace(/\s+/g, '_').replace(/[^\w]/g, '');

  console.log('In progress...');

  const [img] = await new Promise(resolve2 => {
    const image = new Image()
    image.onload = () => resolve2([image])
    image.src = path.join(imagesFolder, file)
  })

  console.log('Wait for it... IMG: ', img);
  await new Promise((res, rej) => {
    async function Gen() {

      w = Math.ceil(img.width / size);
      h = Math.ceil(img.height / size);

      console.log("image W-H: ", w, h);
      numTiles = w * h;

      for (let y = 0; y > -h; y--) {
        for (let x = 0; x > -w; x--) {

          const section = createCanvas(250, 250);
          const ctx = section.getContext('2d');

          ctx.drawImage(img, y * size, x * size);

          generatedPngFiles.push(section);

          // ctx.clearRect(0, 0, 100, 100);
          str += `:${prefix}_${-x}_${-y}:`;
        }

        str += '\r\n';
      }

      res();
    };
    Gen();
  });
  console.log("----------Split Finished------------")
}
loadImages();

async function createGif(algorithm) {
  return new Promise(async resolve1 => {
    const files = await readdirAsync(imagesFolder)

    const width = height = 250;

    const dstPath = path.join(__dirname, 'output', `${algorithm}.gif`)

    const writeStream = createWriteStream(dstPath)

    writeStream.on('close', () => {
      resolve1()
    })

    const encoder = new GIFEncoder(width, height, algorithm)

    encoder.createReadStream().pipe(writeStream)
    encoder.start()
    encoder.setDelay(143)

    const canvas = createCanvas(width, height)
    const ctx1 = canvas.getContext('2d')
    console.log(generatedPngFiles.length);
    for (const file of generatedPngFiles) {
      ctx1.drawImage(file, 0, 0);
      encoder.addFrame(ctx1);
    }
  })
}

createGif('octree')