"use strict";

var Container = PIXI.Container,
    TextureCache = PIXI.utils.TextureCache,
    Texture = PIXI.Texture,
    Rectangle = PIXI.Rectangle,
    MovieClip = PIXI.extras.MovieClip,
    Sprite = PIXI.Sprite,
    TilingSprite = PIXI.extras.TilingSprite;

function sprite(source, x, y, tiling, width, height) {
  if (x === undefined) x = 0;
  if (y === undefined) y = 0;
  if (tiling === undefined) tiling = false;

  var o = undefined,
      texture = undefined;

  //Create a sprite if the `source` is a string
  if (typeof source === "string") {

    //Access the texture in the cache if it's there
    if (TextureCache[source]) {
      texture = TextureCache[source];
    }

    //If it's not is the cache, load it from the source file
    else {
      texture = Texture.fromImage(source);
    }

    //If the texture was created, make the o
    if (texture) {

      //If `tiling` is `false`, make a regular `Sprite`
      if (!tiling) {
        o = new Sprite(texture);
      }

      //If `tiling` is `true` make a `TilingSprite`
      else {
        o = new TilingSprite(texture, width, height);
      }
    }
    //But if the source still can't be found, alert the user
    else {
      console.log("" + source + " cannot be found");
    }
  }

  //Create a o if the `source` is a texture
  else if (source instanceof Texture) {
    if (!tiling) {
      o = new Sprite(source);
    } else {
      o = new TilingSprite(source, width, height);
    }
  }

  //Create a `MovieClip` o if the `source` is an array
  else if (source instanceof Array) {

    //Is it an array of frame ids or textures?
    if (typeof source[0] === "string") {

      //They're strings, but are they pre-existing texture or
      //paths to image files?
      //Check to see if the first element matches a texture in the
      //cache
      if (TextureCache[source[0]]) {

        //It does, so it's an array of frame ids
        o = MovieClip.fromFrames(source);
      } else {

        //It's not already in the cache, so let's load it
        o = MovieClip.fromImages(source);
      }
    }

    //If the `source` isn't an array of strings, check whether
    //it's an array of textures
    else if (source[0] instanceof Texture) {

      //Yes, it's an array of textures.
      //Use them to make a MovieClip o
      o = new MovieClip(source);
    }
  }

  //If the sprite was successfully created, intialize it
  if (o) {

    //Position the sprite
    o.x = x;
    o.y = y;

    //Set optional width and height
    if (width) o.width = width;
    if (height) o.height = height;

    //If the sprite is a MovieClip, add a state player so that
    //it's easier to control
    if (o instanceof MovieClip) addStatePlayer(o);

    //Add some extra properties to the sprite
    //addProperties(o);

    //Assign the sprite
    return o;
  }
}

function addStatePlayer(sprite) {

  var frameCounter = 0,
      numberOfFrames = 0,
      startFrame = 0,
      endFrame = 0,
      timerInterval = undefined;

  //The `show` function (to display static states)
  function show(frameNumber) {

    //Reset any possible previous animations
    reset();

    //Find the new state on the sprite
    sprite.gotoAndStop(frameNumber);
  }

  //The `stop` function stops the animation at the current frame
  function stopAnimation() {
    reset();
    sprite.gotoAndStop(sprite.currentFrame);
  }

  //The `playSequence` function, to play a sequence of frames
  function playAnimation(sequenceArray) {

    //Reset any possible previous animations
    reset();

    //Figure out how many frames there are in the range
    if (!sequenceArray) {
      startFrame = 0;
      endFrame = sprite.totalFrames - 1;
    } else {
      startFrame = sequenceArray[0];
      endFrame = sequenceArray[1];
    }

    //Calculate the number of frames
    numberOfFrames = endFrame - startFrame;

    //Compensate for two edge cases:
    //1. If the `startFrame` happens to be `0`
    /*
    if (startFrame === 0) {
      numberOfFrames += 1;
      frameCounter += 1;
    }
    */

    //2. If only a two-frame sequence was provided
    /*
    if(numberOfFrames === 1) {
      numberOfFrames = 2;
      frameCounter += 1;
    }  
    */

    //Calculate the frame rate. Set the default fps to 12
    if (!sprite.fps) sprite.fps = 12;
    var frameRate = 1000 / sprite.fps;

    //Set the sprite to the starting frame
    sprite.gotoAndStop(startFrame);

    //Set the `frameCounter` to the first frame
    frameCounter = 1;

    //If the state isn't already `playing`, start it
    if (!sprite.animating) {
      timerInterval = setInterval(advanceFrame.bind(this), frameRate);
      sprite.animating = true;
    }
  }

  //`advanceFrame` is called by `setInterval` to display the next frame
  //in the sequence based on the `frameRate`. When the frame sequence
  //reaches the end, it will either stop or loop
  function advanceFrame() {

    //Advance the frame if `frameCounter` is less than
    //the state's total frames
    if (frameCounter < numberOfFrames + 1) {

      //Advance the frame
      sprite.gotoAndStop(sprite.currentFrame + 1);

      //Update the frame counter
      frameCounter += 1;

      //If we've reached the last frame and `loop`
      //is `true`, then start from the first frame again
    } else {
      if (sprite.loop) {
        sprite.gotoAndStop(startFrame);
        frameCounter = 1;
      }
    }
  }

  function reset() {

    //Reset `sprite.playing` to `false`, set the `frameCounter` to 0, //and clear the `timerInterval`
    if (timerInterval !== undefined && sprite.animating === true) {
      sprite.animating = false;
      frameCounter = 0;
      startFrame = 0;
      endFrame = 0;
      numberOfFrames = 0;
      clearInterval(timerInterval);
    }
  }

  //Add the `show`, `play`, `stop`, and `playSequence` methods to the sprite
  sprite.show = show;
  sprite.stopAnimation = stopAnimation;
  sprite.playAnimation = playAnimation;
}

function filmstrip(texture, frameWidth, frameHeight) {
  var spacing = arguments[3] === undefined ? 0 : arguments[3];

  //An array to store the x/y positions of the frames
  var positions = [];

  //Find the width and height of the texture
  var textureWidth = TextureCache[texture].width,
      textureHeight = TextureCache[texture].height;

  //Find out how many columns and rows there are
  var columns = textureWidth / frameWidth,
      rows = textureHeight / frameHeight;

  //Find the total number of frames
  var numberOfFrames = columns * rows;

  for (var i = 0; i < numberOfFrames; i++) {

    //Find the correct row and column for each frame
    //and figure out its x and y position
    var x = i % columns * frameWidth,
        y = Math.floor(i / columns) * frameHeight;

    //Compensate for any optional spacing (padding) around the tiles if
    //there is any. This bit of code accumlates the spacing offsets from the
    //left side of the tileset and adds them to the current tile's position
    if (spacing > 0) {
      x += spacing + spacing * i % columns;
      y += spacing + spacing * Math.floor(i / columns);
    }

    //Add the x and y value of each frame to the `positions` array
    positions.push([x, y]);
  }
  console.log(positions);

  //Return the frames
  return frames(texture, positions, frameWidth, frameHeight);
};

//Make a texture from a frame in another texture or image
function frame(source, x, y, width, height) {

  var texture = undefined,
      imageFrame = undefined;

  //If the source is a string, it's either a texture in the
  //cache or an image file
  if (typeof source === "string") {
    if (TextureCache[source]) {
      texture = new Texture(TextureCache[source]);
    }
  }

  //If the `source` is a texture,  use it
  else if (source instanceof Texture) {
    texture = new Texture(source);
  }
  if (!texture) {
    console.log("Please load the " + source + " texture into the cache.");
  } else {

    //Make a rectangle the size of the sub-image
    imageFrame = new Rectangle(x, y, width, height);
    texture.frame = imageFrame;
    return texture;
  }
}

//Make an array of textures from a 2D array of frame x and y coordinates in
//texture
function frames(source, coordinates, frameWidth, frameHeight) {

  var baseTexture = undefined,
      textures = undefined;

  //If the source is a string, it's either a texture in the
  //cache or an image file
  if (typeof source === "string") {
    if (TextureCache[source]) {
      baseTexture = new Texture(TextureCache[source]);
    }
  }
  //If the `source` is a texture,  use it
  else if (source instanceof Texture) {
    baseTexture = new Texture(source);
  }
  if (!baseTexture) {
    console.log("Please load the " + source + " texture into the cache.");
  } else {
    var _textures = coordinates.map(function (position) {
      var x = position[0],
          y = position[1];
      var imageFrame = new Rectangle(x, y, frameWidth, frameHeight);
      var frameTexture = new Texture(baseTexture);
      frameTexture.frame = imageFrame;
      return frameTexture;
    });
    return _textures;
  }
}

function frameSeries() {
  var startNumber = arguments[0] === undefined ? 0 : arguments[0];
  var endNumber = arguments[1] === undefined ? 1 : arguments[1];
  var baseName = arguments[2] === undefined ? "" : arguments[2];
  var extension = arguments[3] === undefined ? "" : arguments[3];

  //Create an array to store the frame names
  var frames = [];

  for (var i = startNumber; i < endNumber + 1; i++) {
    var _frame = baseName + i + extension;
    frames.push(_frame);
  }

  return frames;
}
//# sourceMappingURL=spriteUtilities.js.map