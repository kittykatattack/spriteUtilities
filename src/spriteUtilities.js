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
      
      //An array to store all the shaking sprites
      this.shakingSprites = [];
    }
  }

  update() {
    if (this.shakingSprites.length > 0) {
      for(let i = this.shakingSprites.length - 1; i >= 0; i--) {
        let shakingSprite = this.shakingSprites[i];
        if (shakingSprite.updateShake) shakingSprite.updateShake();
      } 
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
        throw new Error(`${source} cannot be found`);
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

  //`tilingSpirte` lets you quickly create Pixi tiling sprites
  tilingSprite(source, width, height, x, y) {
    if (width === undefined) {
      throw new Error("Please define a width as your second argument for the tiling sprite");
    }
    if (height === undefined) {
      throw new Error("Please define a height as your third argument for the tiling sprite");
    }
    let o = this.sprite(source, x, y, true, width, height);

    //Add `tileX`, `tileY`, `tileScaleX` and `tileScaleY` properties
    Object.defineProperties(o, {
      "tileX": {
        get() {
          return o.tilePosition.x;
        },
        set(value) {
          o.tilePosition.x = value;
        }, 
        enumerable: true, configurable: true
      },
      "tileY": {
        get() {
          return o.tilePosition.y;
        },
        set(value) {
          o.tilePosition.y = value;
        }, 
        enumerable: true, configurable: true
      },
      "tileScaleX": {
        get() {
          return o.tileScale.x;
        },
        set(value) {
          o.tileScale.x = value;
        }, 
        enumerable: true, configurable: true
      },
      "tileScaleY": {
        get() {
          return o.tileScale.y;
        },
        set(value) {
          o.tileScale.y = value;
        }, 
        enumerable: true, configurable: true
      },
    });
    
    return o
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
      throw new Error(`Please load the ${source} texture into the cache.`);
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
      throw new Error(`Please load the ${source} texture into the cache.`);
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

    let o = new this.Graphics();
    o._sprite = undefined;
    o._width = width;
    o._height = height;
    o._fillStyle = this.color(fillStyle);
    o._strokeStyle = this.color(strokeStyle);
    o._lineWidth = lineWidth;

    //Draw the rectangle
    let draw = (width, height, fillStyle, strokeStyle, lineWidth) => {
      o.clear();
      o.beginFill(fillStyle);
      if (lineWidth > 0) {
        o.lineStyle(lineWidth, strokeStyle, 1);
      }
      o.drawRect(0, 0, width, height);
      o.endFill();
    };

    //Draw the line and capture the sprite that the `draw` function
    //returns
    draw(o._width, o._height, o._fillStyle, o._strokeStyle, o._lineWidth);

    //Generate a texture from the rectangle
    let texture = o.generateTexture();

    //Use the texture to create a sprite
    let sprite = new this.Sprite(texture);

    //Position the sprite
    sprite.x = x;
    sprite.y = y;

    //Add getters and setters to the sprite
    let self = this;
    Object.defineProperties(sprite, {
      "fillStyle": {
        get() {
          return o._fillStyle;
        },
        set(value) {
          o._fillStyle = self.color(value);

          //Draw the new rectangle 
          draw(o._width, o._height, o._fillStyle, o._strokeStyle, o._lineWidth, o._x, o._y);

          //Generate a new texture and set it as the sprite's texture
          let texture = o.generateTexture();
          o._sprite.texture = texture;
        }, 
        enumerable: true, configurable: true
      },
      "strokeStyle": {
        get() {
          return o._strokeStyle;
        },
        set(value) {
          o._strokeStyle = self.color(value);

          //Draw the new rectangle 
          draw(o._width, o._height, o._fillStyle, o._strokeStyle, o._lineWidth, o._x, o._y);

          //Generate a new texture and set it as the sprite's texture
          let texture = o.generateTexture();
          o._sprite.texture = texture;
        }, 
        enumerable: true, configurable: true
      },
      "lineWidth": {
        get() {
          return o._lineWidth;
        },
        set(value) {
          o._lineWidth = value;

          //Draw the new rectangle 
          draw(o._width, o._height, o._fillStyle, o._strokeStyle, o._lineWidth, o._x, o._y);

          //Generate a new texture and set it as the sprite's texture
          let texture = o.generateTexture();
          o._sprite.texture = texture;
        }, 
        enumerable: true, configurable: true
      }
    });
    
    //Get a local reference to the sprite so that we can 
    //change the rectangle properties later using the getters/setters
    o._sprite = sprite;

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

    let o = new this.Graphics();
    o._diameter = diameter;
    o._fillStyle = this.color(fillStyle);
    o._strokeStyle = this.color(strokeStyle);
    o._lineWidth = lineWidth;

    //Draw the circle
    let draw = (diameter, fillStyle, strokeStyle, lineWidth) => {
      o.clear(); 
      o.beginFill(fillStyle);
      if (lineWidth > 0) {
        o.lineStyle(lineWidth, strokeStyle, 1);
      }
      o.drawCircle(0, 0, diameter / 2);
      o.endFill();
    };

    //Draw the cirlce
    draw(o._diameter, o._fillStyle, o._strokeStyle, o._lineWidth);

    //Generate a texture from the rectangle
    let texture = o.generateTexture();

    //Use the texture to create a sprite
    let sprite = new this.Sprite(texture);

    //Position the sprite
    sprite.x = x;
    sprite.y = y;

    //Add getters and setters to the sprite
    let self = this;
    Object.defineProperties(sprite, {
      "fillStyle": {
        get() {
          return o._fillStyle;
        },
        set(value) {
          o._fillStyle = self.color(value);

          //Draw the cirlce
          draw(o._diameter, o._fillStyle, o._strokeStyle, o._lineWidth);

          //Generate a new texture and set it as the sprite's texture
          let texture = o.generateTexture();
          o._sprite.texture = texture;
        }, 
        enumerable: true, configurable: true
      },
      "strokeStyle": {
        get() {
          return o._strokeStyle;
        },
        set(value) {
          o._strokeStyle = self.color(value);

          //Draw the cirlce
          draw(o._diameter, o._fillStyle, o._strokeStyle, o._lineWidth);

          //Generate a new texture and set it as the sprite's texture
          let texture = o.generateTexture();
          o._sprite.texture = texture;
        }, 
        enumerable: true, configurable: true
      },
      "diameter": {
        get() {
          return o._diameter;
        },
        set(value) {
          o._lineWidth = 10;

          //Draw the cirlce
          draw(o._diameter, o._fillStyle, o._strokeStyle, o._lineWidth);

          //Generate a new texture and set it as the sprite's texture
          let texture = o.generateTexture();
          o._sprite.texture = texture;
        }, 
        enumerable: true, configurable: true
      },
      "radius": {
        get() {
          return o._diameter / 2;
        },
        set(value) {

          //Draw the cirlce
          draw(value * 2, o._fillStyle, o._strokeStyle, o._lineWidth);

          //Generate a new texture and set it as the sprite's texture
          let texture = o.generateTexture();
          o._sprite.texture = texture;
        }, 
        enumerable: true, configurable: true
      },
    });
    //Get a local reference to the sprite so that we can 
    //change the circle properties later using the getters/setters
    o._sprite = sprite;

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
    let o = new this.Graphics();

    //Private properties
    o._strokeStyle = this.color(strokeStyle);
    o._width = lineWidth;
    o._ax = ax;
    o._ay = ay;
    o._bx = bx;
    o._by = by;

    //A helper function that draws the line
    let draw = (strokeStyle, lineWidth, ax, ay, bx, by) => {
      o.clear();
      o.lineStyle(lineWidth, strokeStyle, 1);
      o.moveTo(ax, ay);
      o.lineTo(bx, by);
    };
    
    //Draw the line
    draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by);

    //Define getters and setters that redefine the line's start and 
    //end points and re-draws it if they change
    let self = this;
    Object.defineProperties(o, {
      "ax": {
        get() {
          return o._ax;
        },
        set(value) {
          o._ax = value;
          draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by);
        }, 
        enumerable: true, configurable: true
      },
      "ay": {
        get() {
          return o._ay;
        },
        set(value) {
          o._ay = value;
          draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by);
        }, 
        enumerable: true, configurable: true
      },
      "bx": {
        get() {
          return o._bx;
        },
        set(value) {
          o._bx = value;
          draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by);
        }, 
        enumerable: true, configurable: true
      },
      "by": {
        get() {
          return o._by;
        },
        set(value) {
          o._by = value;
          draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by);
        }, 
        enumerable: true, configurable: true
      },
      "strokeStyle": {
        get() {
          return o._strokeStyle;
        },
        set(value) {
          o._strokeStyle = self.color(value);

          //Draw the line
          draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by);
        }, 
        enumerable: true, configurable: true
      },
      "width": {
        get() {
          return o._width;
        },
        set(value) {
          o._width = value;

          //Draw the line
          draw(o._strokeStyle, o._width, o._ax, o._ay, o._bx, o._by);
        }, 
        enumerable: true, configurable: true
      }
    });

    //Return the line
    return o;
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

  //Use `shoot` to create bullet sprites 
  shoot(
    shooter, angle, x, y, container, bulletSpeed, bulletArray, bulletSprite
  ) {

    //Make a new sprite using the user-supplied `bulletSprite` function
    let bullet = bulletSprite();

    //Set the bullet's anchor point to its center
    bullet.anchor.set(0.5, 0.5);

    //Temporarily add the bullet to the shooter
    //so that we can position it relative to the
    //shooter's position
    shooter.addChild(bullet);
    bullet.x = x;
    bullet.y = y;

    //Find the bullet's global coordinates so that we can use
    //them to position the bullet on the new parent container
    let tempGx = bullet.getGlobalPosition().x,
        tempGy = bullet.getGlobalPosition().y;

    //Add the bullet to the new parent container using
    //the new global coordinates
    container.addChild(bullet);
    bullet.x = tempGx;
    bullet.y = tempGy;

    //Set the bullet's velocity
    bullet.vx = Math.cos(angle) * bulletSpeed;
    bullet.vy = Math.sin(angle) * bulletSpeed;

    //Push the bullet into the `bulletArray`
    bulletArray.push(bullet);
  }

  /*
  grid
  ----

  Helps you to automatically create a grid of sprites. `grid` returns a
  `group` sprite object that contains a sprite for every cell in the
  grid. You can define the rows and columns in the grid, whether or
  not the sprites should be centered inside each cell, or what their offset from the
  top left corner of each cell should be. Supply a function that
  returns the sprite that you want to make for each cell. You can
  supply an optional final function that runs any extra code after
  each sprite has been created. Here's the format for creating a grid:

      gridGroup = grid(

        //Set the grid's properties
        columns, rows, cellWidth, cellHeight,
        areSpirtesCentered?, xOffset, yOffset,

        //A function that returns a sprite
        () => g.circle(16, "blue"),

        //An optional final function that runs some extra code
        () => console.log("extra!")
      );
  */

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
    let container = this.group();

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
            - sprite.halfWidth + xOffset;
          sprite.y 
            = y + (cellHeight / 2) 
            - sprite.halfHeight + yOffset;
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

  /*
  shake
  -----

  Used to create a shaking effect, like a screen shake
  */

  shake(sprite, magnitude = 16, angular = false) {

    //Get a reference to this current object so that
    //it's easy to maintain scope in the nested sub-functions
    let self = this;

    //A counter to count the number of shakes
    let counter = 1;

    //The total number of shakes (there will be 1 shake per frame)
    let numberOfShakes = 10;

    //Capture the sprite's position and angle so you can
    //restore them after the shaking has finished
    let startX = sprite.x,
        startY = sprite.y,
        startAngle = sprite.rotation;

    //Divide the magnitude into 10 units so that you can 
    //reduce the amount of shake by 10 percent each frame
    let magnitudeUnit = magnitude / numberOfShakes;
    
    //The `randomInt` helper function
    let randomInt = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    //Add the sprite to the `shakingSprites` array if it
    //isn't already there
    if(self.shakingSprites.indexOf(sprite) === -1) {

      self.shakingSprites.push(sprite);
      
      //Add an `updateShake` method to the sprite.
      //The `updateShake` method will be called each frame
      //in the game loop. The shake effect type can be either
      //up and down (x/y shaking) or angular (rotational shaking).
      sprite.updateShake = () => {
        if(angular) {
          angularShake();
        } else {
          upAndDownShake();
        }
      };
    }

    //The `upAndDownShake` function
    function upAndDownShake() {

      //Shake the sprite while the `counter` is less than 
      //the `numberOfShakes`
      if (counter < numberOfShakes) {

        //Reset the sprite's position at the start of each shake
        sprite.x = startX;
        sprite.y = startY;

        //Reduce the magnitude
        magnitude -= magnitudeUnit;

        //Randomly change the sprite's position
        sprite.x += randomInt(-magnitude, magnitude);
        sprite.y += randomInt(-magnitude, magnitude);

        //Add 1 to the counter
        counter += 1;
      }

      //When the shaking is finished, restore the sprite to its original 
      //position and remove it from the `shakingSprites` array
      if (counter >= numberOfShakes) {
        sprite.x = startX;
        sprite.y = startY;
        self.shakingSprites.splice(self.shakingSprites.indexOf(sprite), 1);
      }
    }
    
    //The `angularShake` function
    //First set the initial tilt angle to the right (+1) 
    let tiltAngle = 1;

    function angularShake() {
      if (counter < numberOfShakes) {

        //Reset the sprite's rotation
        sprite.rotation = startAngle;

        //Reduce the magnitude
        magnitude -= magnitudeUnit;

        //Rotate the sprite left or right, depending on the direction,
        //by an amount in radians that matches the magnitude
        sprite.rotation = magnitude * tiltAngle;
        counter += 1;

        //Reverse the tilt angle so that the sprite is tilted
        //in the opposite direction for the next shake
        tiltAngle *= -1;
      }

      //When the shaking is finished, reset the sprite's angle and
      //remove it from the `shakingSprites` array
      if (counter >= numberOfShakes) {
        sprite.rotation = startAngle;
        self.shakingSprites.splice(self.shakingSprites.indexOf(sprite), 1);
      }
    }
  }

  /*
  _getCenter
  ----------

  A utility that finds the center point of the sprite. If it's anchor point is the
  sprite's top left corner, then the center is calculated from that point.
  If the anchor point has been shifted, then the anchor x/y point is used as the sprite's center
  */

  _getCenter(o, dimension, axis) {
    if (o.anchor !== undefined) {
      if (o.anchor[axis] !== 0) {
        return 0;
      } else {
        return dimension / 2;
      }
    } else {
      return dimension; 
    }
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
    let o = new this.ParticleContainer(size, options);
    return o;
  }

  //`remove` is a global convenience method that will
  //remove any sprite, or an argument list of sprites, from its parent.
  remove(...sprites) {

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

  /* Color conversion */
  //From: http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
  //Utilities to convert HTML color string names to hexadecimal codes

  colorToRGBA(color) {
    // Returns the color as an array of [r, g, b, a] -- all range from 0 - 255
    // color must be a valid canvas fillStyle. This will cover most anything
    // you'd want to use.
    // Examples:
    // colorToRGBA('red')  # [255, 0, 0, 255]
    // colorToRGBA('#f00') # [255, 0, 0, 255]
    var cvs, ctx;
    cvs = document.createElement('canvas');
    cvs.height = 1;
    cvs.width = 1;
    ctx = cvs.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    let data = ctx.getImageData(0, 0, 1, 1).data; 
    return data;
  }

  byteToHex(num) {
    // Turns a number (0-255) into a 2-character hex number (00-ff)
    return ('0'+num.toString(16)).slice(-2);
  }

  colorToHex(color) {
    // Convert any CSS color to a hex representation
    // Examples:
    // colorToHex('red')            # '#ff0000'
    // colorToHex('rgb(255, 0, 0)') # '#ff0000'
    var rgba, hex;
    rgba = this.colorToRGBA(color);
    hex = [0,1,2].map(
      idx => this.byteToHex(rgba[idx])
      ).join('');
    return "0x" + hex;
  }

  //A function to find out if the user entered a number (a hex color
  //code) or a string (an HTML color string)
  color(value) {

    //Check if it's a number
    if(!isNaN(value)){

      //Yes, it is a number, so just return it
      return value;
    }

    //No it's not a number, so it must be a string    
    else {

      return parseInt(this.colorToHex(value));
      /*

      //Find out what kind of color string it is.
      //Let's first grab the first character of the string
      let firstCharacter = value.charAt(0);

      //If the first character is a "#" or a number, then
      //we know it must be a RGBA color
      if (firstCharacter === "#") {
        console.log("first character: " + value.charAt(0))
      }
      */
    }
    
    /*
    //Find out if the first character in the string is a number
    if (!isNaN(parseInt(string.charAt(0)))) {
      
      //It's not, so convert it to a hex code
      return colorToHex(string);
      
    //The use input a number, so it must be a hex code. Just return it
    } else {
    
      return string;
    }
    
  */

  }
  
}



