class SpriteUtilities{
  constructor(renderingEngine = PIXI) {
    if (renderingEngine === undefined) throw new Error("Please supply a reference to PIXI in the SpriteUtilities constructor before using spriteUtilities.js"); 

    //Find out which rendering engine is being used (the default is Pixi)
    this.renderer = "";

    //If the `renderingEngine` is Pixi, set up Pixi object aliases
    if (renderingEngine.ParticleContainer && renderingEngine.Sprite) {
      this.renderer = "pixi";
      this.Container = renderingEngine.Container;
      this.ParticleContainer = renderingEngine.ParticleContainer;
      this.TextureCache = renderingEngine.utils.TextureCache;
      this.Texture = renderingEngine.Texture;
      this.Rectangle = renderingEngine.Rectangle;
      this.MovieClip = renderingEngine.extras.MovieClip;
      this.BitmapText = renderingEngine.extras.BitmapText;
      this.Sprite = renderingEngine.Sprite;
      this.TilingSprite = renderingEngine.extras.TilingSprite;
      this.Graphics = renderingEngine.Graphics;
      this.Text = renderingEngine.Text;
    }
  }

  sprite(source, x = 0, y = 0, tiling = false, width, height) {

    let o, texture;

    //Create a sprite if the `source` is a string 
    if (typeof source === "string") {

      //Access the texture in the cache if it's there
      if (this.TextureCache[source]) {
        texture = this.TextureCache[source];
      }

      //If it's not is the cache, load it from the source file
      else {
        texture = this.Texture.fromImage(source);
      }

      //If the texture was created, make the o
      if (texture) {

        //If `tiling` is `false`, make a regular `Sprite`
        if (!tiling) {
          o = new this.Sprite(texture);
        }

        //If `tiling` is `true` make a `TilingSprite`
        else {
          o = new this.TilingSprite(texture, width, height);
        }
      }
      //But if the source still can't be found, alert the user
      else {
        console.log(`${source} cannot be found`);
      }
    }

    //Create a o if the `source` is a texture
    else if (source instanceof this.Texture) {
      if (!tiling) {
        o = new this.Sprite(source);
      } else {
        o = new this.TilingSprite(source, width, height);
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
        if (this.TextureCache[source[0]]) {

          //It does, so it's an array of frame ids
          o = this.MovieClip.fromFrames(source);
        } else {

          //It's not already in the cache, so let's load it
          o = this.MovieClip.fromImages(source);
        }
      }

      //If the `source` isn't an array of strings, check whether
      //it's an array of textures
      else if (source[0] instanceof this.Texture) {

        //Yes, it's an array of textures. 
        //Use them to make a MovieClip o 
        o = new this.MovieClip(source);
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
      if (o instanceof this.MovieClip) this.addStatePlayer(o);

      //Assign the sprite
      return o;
    }
  }

  addStatePlayer(sprite) {

    let frameCounter = 0,
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
      let frameRate = 1000 / sprite.fps;

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

  filmstrip(
    texture,
    frameWidth,
    frameHeight,
    spacing = 0
  ) {

    //An array to store the x/y positions of the frames
    let positions = [];

    //Find the width and height of the texture
    let textureWidth = this.TextureCache[texture].width,
      textureHeight = this.TextureCache[texture].height;

    //Find out how many columns and rows there are
    let columns = textureWidth / frameWidth,
      rows = textureHeight / frameHeight;

    //Find the total number of frames
    let numberOfFrames = columns * rows;

    for (let i = 0; i < numberOfFrames; i++) {

      //Find the correct row and column for each frame
      //and figure out its x and y position
      let x = (i % columns) * frameWidth,
        y = Math.floor(i / columns) * frameHeight;

      //Compensate for any optional spacing (padding) around the tiles if
      //there is any. This bit of code accumlates the spacing offsets from the 
      //left side of the tileset and adds them to the current tile's position 
      if (spacing > 0) {
        x += spacing + (spacing * i % columns);
        y += spacing + (spacing * Math.floor(i / columns));
      }

      //Add the x and y value of each frame to the `positions` array
      positions.push([x, y]);
    }
    console.log(positions)

    //Return the frames
    return this.frames(texture, positions, frameWidth, frameHeight);
  }

  //Make a texture from a frame in another texture or image
  frame(source, x, y, width, height) {

    let texture, imageFrame;

    //If the source is a string, it's either a texture in the
    //cache or an image file
    if (typeof source === "string") {
      if (this.TextureCache[source]) {
        texture = new this.Texture(this.TextureCache[source]);
      }
    }

    //If the `source` is a texture,  use it
    else if (source instanceof this.Texture) {
      texture = new this.Texture(source);
    }
    if (!texture) {
      console.log(`Please load the ${source} texture into the cache.`);
    } else {

      //Make a rectangle the size of the sub-image
      imageFrame = new this.Rectangle(x, y, width, height);
      texture.frame = imageFrame;
      return texture;
    }
  }

  //Make an array of textures from a 2D array of frame x and y coordinates in
  //texture
  frames(source, coordinates, frameWidth, frameHeight) {

    let baseTexture, textures;

    //If the source is a string, it's either a texture in the
    //cache or an image file
    if (typeof source === "string") {
      if (this.TextureCache[source]) {
        baseTexture = new this.Texture(this.TextureCache[source]);
      }
    }
    //If the `source` is a texture,  use it
    else if (source instanceof this.Texture) {
      baseTexture = new this.Texture(source);
    }
    if (!baseTexture) {
      console.log(`Please load the ${source} texture into the cache.`);
    } else {
      let textures = coordinates.map((position) => {
        let x = position[0],
          y = position[1];
        let imageFrame = new this.Rectangle(x, y, frameWidth, frameHeight);
        let frameTexture = new this.Texture(baseTexture);
        frameTexture.frame = imageFrame;
        return frameTexture
      });
      return textures;
    }
  }

  frameSeries(startNumber = 0, endNumber = 1, baseName = "", extension = "") {

    //Create an array to store the frame names
    let frames = [];

    for (let i = startNumber; i < endNumber + 1; i++) {
      let frame = this.TextureCache[`${baseName + i + extension}`];
      frames.push(frame);
    }
    return frames;
  }

  /* Text creation */

  //The`text` method is a quick way to create a Pixi Text sprite
  text(content = "message", font = "16px sans", fillStyle = "red", x = 0, y = 0) {

    //Create a Pixi Sprite object
    let message = new this.Text(content, {font: font, fill: fillStyle});
    message.x = x;
    message.y = y;

    //Add a `_text` property with a getter/setter
    message._content = content;
    Object.defineProperty(message, "content", {
      get() {
        return this._content;
      },
      set(value) {
        this._content = value;
        this.text = value;
      },
      enumerable: true, configurable: true
    });

    //Return the text object
    return message;
  }

  //The`bitmapText` method lets you create bitmap text
  bitmapText(content = "message", font, align, tint, x = 0, y = 0) {

    //Create a Pixi Sprite object
    let message = new this.BitmapText(content, {font: font, align: align, tint: tint});
    message.x = x;
    message.y = y;

    //Add a `_text` property with a getter/setter
    message._content = content;
    Object.defineProperty(message, "content", {
      get() {
        return this._content;
      },
      set(value) {
        this._content = value;
        this.text = value;
      },
      enumerable: true, configurable: true
    });

    //Return the text object
    return message;
  }

  /* Shapes and lines */

  //Rectangle
  rectangle(
      width = 32, 
      height = 32,  
      fillStyle = 0xFF3300, 
      strokeStyle = 0x0033CC, 
      lineWidth = 0,
      x = 0, 
      y = 0 
    ){

    //Draw the rectangle
    let rectangle = new this.Graphics();
    rectangle.beginFill(fillStyle);
    if (lineWidth > 0) {
      rectangle.lineStyle(lineWidth, strokeStyle, 1);
    }
    rectangle.drawRect(0, 0, width, height);
    rectangle.endFill();

    //Generate a texture from the rectangle
    let texture = rectangle.generateTexture();

    //Use the texture to create a sprite
    let sprite = new this.Sprite(texture);

    //Position the sprite
    sprite.x = x;
    sprite.y = y;

    //Return the sprite
    return sprite;
  }

  //Circle
  circle(
      diameter = 32, 
      fillStyle = 0xFF3300, 
      strokeStyle = 0x0033CC, 
      lineWidth = 0,
      x = 0, 
      y = 0 
    ){

    //Draw the circle
    let circle = new this.Graphics();
    circle.beginFill(fillStyle);
    if (lineWidth > 0) {
      circle.lineStyle(lineWidth, strokeStyle, 1);
    }
    circle.drawCircle(0, 0, diameter / 2);
    circle.endFill();

    //Generate a texture from the rectangle
    let texture = circle.generateTexture();

    //Use the texture to create a sprite
    let sprite = new this.Sprite(texture);

    //Position the sprite
    sprite.x = x;
    sprite.y = y;

    //Return the sprite
    return sprite;
  }

  //Line
  line(
      strokeStyle = 0x000000, 
      lineWidth = 1, 
      ax = 0, 
      ay = 0, 
      bx = 32, 
      by = 32
    ){

    //Create the line object
    let line = new this.Graphics();

    //Add properties
    line._ax = ax;
    line._ay = ay;
    line._bx = bx;
    line._by = by;
    line.strokeStyle = strokeStyle;
    line.lineWidth = lineWidth;

    //A helper function that draws the line
    line.draw = () => {
      line.clear();
      line.lineStyle(lineWidth, strokeStyle, 1);
      line.moveTo(line._ax, line._ay);
      line.lineTo(line._bx, line._by);
    };
    line.draw();

    //Define getters and setters that redefine the line's start and 
    //end points and re-draws it if they change
    Object.defineProperties(line, {
      "ax": {
        get() {
          return this._ax;
        },
        set(value) {
          this._ax = value;
          this.draw();
        }, 
        enumerable: true, configurable: true
      },
      "ay": {
        get() {
          return this._ay;
        },
        set(value) {
          this._ay = value;
          this.draw();
        }, 
        enumerable: true, configurable: true
      },
      "bx": {
        get() {
          return this._bx;
        },
        set(value) {
          this._bx = value;
          this.draw();
        }, 
        enumerable: true, configurable: true
      },
      "by": {
        get() {
          return this._by;
        },
        set(value) {
          this._by = value;
          this.draw();
        }, 
        enumerable: true, configurable: true
      },
    });

    //Return the line
    return line;
  }

  /* Compound sprites */

  //Use `grid` to create a grid of sprites
  grid(
    columns = 0, rows = 0, cellWidth = 32, cellHeight = 32,
    centerCell = false, xOffset = 0, yOffset = 0,
    makeSprite = undefined,
    extra = undefined
  ){

    //Create an empty group called `container`. This `container`
    //group is what the function returns back to the main program.
    //All the sprites in the grid cells will be added
    //as children to this container
    let container = new this.Container();

    //The `create` method plots the grid

    let createGrid = () => {

      //Figure out the number of cells in the grid
      let length = columns * rows;

      //Create a sprite for each cell
      for(let i = 0; i < length; i++) {

        //Figure out the sprite's x/y placement in the grid
        let x = (i % columns) * cellWidth,
            y = Math.floor(i / columns) * cellHeight;

        //Use the `makeSprite` function supplied in the constructor
        //to make a sprite for the grid cell
        let sprite = makeSprite();

        //Add the sprite to the `container`
        container.addChild(sprite);

        //Should the sprite be centered in the cell?

        //No, it shouldn't be centered
        if (!centerCell) {
          sprite.x = x + xOffset;
          sprite.y = y + yOffset;
        }

        //Yes, it should be centered
        else {
          sprite.x 
            = x + (cellWidth / 2) 
            - (sprite.width / 2) + xOffset;
          sprite.y 
            = y + (cellHeight / 2) 
            - (sprite.width / 2) + yOffset;
        }

        //Run any optional extra code. This calls the
        //`extra` function supplied by the constructor
        if (extra) extra(sprite);
      }
    };

    //Run the `createGrid` method
    createGrid();

    //Return the `container` group back to the main program
    return container;
  }


  /* Groups */

  //Group sprites into a container
  group(...sprites) {
    let container = new this.Container();
    sprites.forEach(sprite => {
      container.addChild(sprite);
    });
    return container;
  }

  //Use the `batch` method to create a ParticleContainer
  batch(size = 15000, options = {rotation: true, alpha: true, scale: true, uvs: true}) {
    let batch = new this.ParticleContainer(size, options);
    return batch;
  }

  //`remove` is a global convenience method that will
  //remove any sprite, or an argument list of sprites, from its parent.
  remove(...spritesToRemove) {

    //Remove sprites that's aren't in an array
    if (!(sprites[0] instanceof Array)) {
      if (sprites.length > 1) {
        sprites.forEach(sprite  => {
          sprite.parent.removeChild(sprite);
        });
      } else {
        sprites[0].parent.removeChild(sprites[0]);
      }
    }

    //Remove sprites in an array of sprites
    else {
      let spritesArray = sprites[0];
      if (spritesArray.length > 0) {
        for (let i = spritesArray.length - 1; i >= 0; i--) {
          let sprite = spritesArray[i];
          sprite.parent.removeChild(sprite);
          spritesArray.splice(spritesArray.indexOf(sprite), 1);
        }
      }
    }
  }
  
}



