"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SpriteUtilities = (function () {
  function SpriteUtilities() {
    var renderingEngine = arguments[0] === undefined ? PIXI : arguments[0];

    _classCallCheck(this, SpriteUtilities);

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

  _createClass(SpriteUtilities, [{
    key: "sprite",
    value: function sprite(source, x, y, tiling, width, height) {
      if (x === undefined) x = 0;
      if (y === undefined) y = 0;
      if (tiling === undefined) tiling = false;

      var o = undefined,
          texture = undefined;

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
          console.log("" + source + " cannot be found");
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
  }, {
    key: "addStatePlayer",
    value: function addStatePlayer(sprite) {

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
  }, {
    key: "filmstrip",
    value: function filmstrip(texture, frameWidth, frameHeight) {
      var spacing = arguments[3] === undefined ? 0 : arguments[3];

      //An array to store the x/y positions of the frames
      var positions = [];

      //Find the width and height of the texture
      var textureWidth = this.TextureCache[texture].width,
          textureHeight = this.TextureCache[texture].height;

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
      return this.frames(texture, positions, frameWidth, frameHeight);
    }
  }, {
    key: "frame",

    //Make a texture from a frame in another texture or image
    value: function frame(source, x, y, width, height) {

      var texture = undefined,
          imageFrame = undefined;

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
        console.log("Please load the " + source + " texture into the cache.");
      } else {

        //Make a rectangle the size of the sub-image
        imageFrame = new this.Rectangle(x, y, width, height);
        texture.frame = imageFrame;
        return texture;
      }
    }
  }, {
    key: "frames",

    //Make an array of textures from a 2D array of frame x and y coordinates in
    //texture
    value: function frames(source, coordinates, frameWidth, frameHeight) {
      var _this = this;

      var baseTexture = undefined,
          textures = undefined;

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
        console.log("Please load the " + source + " texture into the cache.");
      } else {
        var _textures = coordinates.map(function (position) {
          var x = position[0],
              y = position[1];
          var imageFrame = new _this.Rectangle(x, y, frameWidth, frameHeight);
          var frameTexture = new _this.Texture(baseTexture);
          frameTexture.frame = imageFrame;
          return frameTexture;
        });
        return _textures;
      }
    }
  }, {
    key: "frameSeries",
    value: function frameSeries() {
      var startNumber = arguments[0] === undefined ? 0 : arguments[0];
      var endNumber = arguments[1] === undefined ? 1 : arguments[1];
      var baseName = arguments[2] === undefined ? "" : arguments[2];
      var extension = arguments[3] === undefined ? "" : arguments[3];

      //Create an array to store the frame names
      var frames = [];

      for (var i = startNumber; i < endNumber + 1; i++) {
        var frame = this.TextureCache["" + (baseName + i + extension)];
        frames.push(frame);
      }
      return frames;
    }
  }, {
    key: "text",

    /* Text creation */

    //The`text` method is a quick way to create a Pixi Text sprite
    value: function text() {
      var content = arguments[0] === undefined ? "message" : arguments[0];
      var font = arguments[1] === undefined ? "16px sans" : arguments[1];
      var fillStyle = arguments[2] === undefined ? "red" : arguments[2];
      var x = arguments[3] === undefined ? 0 : arguments[3];
      var y = arguments[4] === undefined ? 0 : arguments[4];

      //Create a Pixi Sprite object
      var message = new this.Text(content, { font: font, fill: fillStyle });
      message.x = x;
      message.y = y;

      //Add a `_text` property with a getter/setter
      message._content = content;
      Object.defineProperty(message, "content", {
        get: function get() {
          return this._content;
        },
        set: function set(value) {
          this._content = value;
          this.text = value;
        },
        enumerable: true, configurable: true
      });

      //Return the text object
      return message;
    }
  }, {
    key: "bitmapText",

    //The`bitmapText` method lets you create bitmap text
    value: function bitmapText(content, font, align, tint) {
      if (content === undefined) content = "message";
      var x = arguments[4] === undefined ? 0 : arguments[4];
      var y = arguments[5] === undefined ? 0 : arguments[5];

      //Create a Pixi Sprite object
      var message = new this.BitmapText(content, { font: font, align: align, tint: tint });
      message.x = x;
      message.y = y;

      //Add a `_text` property with a getter/setter
      message._content = content;
      Object.defineProperty(message, "content", {
        get: function get() {
          return this._content;
        },
        set: function set(value) {
          this._content = value;
          this.text = value;
        },
        enumerable: true, configurable: true
      });

      //Return the text object
      return message;
    }
  }, {
    key: "rectangle",

    /* Shapes and lines */

    //Rectangle
    value: function rectangle() {
      var width = arguments[0] === undefined ? 32 : arguments[0];
      var height = arguments[1] === undefined ? 32 : arguments[1];
      var fillStyle = arguments[2] === undefined ? 16724736 : arguments[2];
      var strokeStyle = arguments[3] === undefined ? 13260 : arguments[3];
      var lineWidth = arguments[4] === undefined ? 0 : arguments[4];
      var x = arguments[5] === undefined ? 0 : arguments[5];
      var y = arguments[6] === undefined ? 0 : arguments[6];

      //Draw the rectangle
      var rectangle = new this.Graphics();
      rectangle.beginFill(fillStyle);
      if (lineWidth > 0) {
        rectangle.lineStyle(lineWidth, strokeStyle, 1);
      }
      rectangle.drawRect(0, 0, width, height);
      rectangle.endFill();

      //Generate a texture from the rectangle
      var texture = rectangle.generateTexture();

      //Use the texture to create a sprite
      var sprite = new this.Sprite(texture);

      //Position the sprite
      sprite.x = x;
      sprite.y = y;

      //Return the sprite
      return sprite;
    }
  }, {
    key: "circle",

    //Circle
    value: function circle() {
      var diameter = arguments[0] === undefined ? 32 : arguments[0];
      var fillStyle = arguments[1] === undefined ? 16724736 : arguments[1];
      var strokeStyle = arguments[2] === undefined ? 13260 : arguments[2];
      var lineWidth = arguments[3] === undefined ? 0 : arguments[3];
      var x = arguments[4] === undefined ? 0 : arguments[4];
      var y = arguments[5] === undefined ? 0 : arguments[5];

      //Draw the circle
      var circle = new this.Graphics();
      circle.beginFill(fillStyle);
      if (lineWidth > 0) {
        circle.lineStyle(lineWidth, strokeStyle, 1);
      }
      circle.drawCircle(0, 0, diameter / 2);
      circle.endFill();

      //Generate a texture from the rectangle
      var texture = circle.generateTexture();

      //Use the texture to create a sprite
      var sprite = new this.Sprite(texture);

      //Position the sprite
      sprite.x = x;
      sprite.y = y;

      //Return the sprite
      return sprite;
    }
  }, {
    key: "line",

    //Line
    value: function line() {
      var strokeStyle = arguments[0] === undefined ? 0 : arguments[0];
      var lineWidth = arguments[1] === undefined ? 1 : arguments[1];
      var ax = arguments[2] === undefined ? 0 : arguments[2];
      var ay = arguments[3] === undefined ? 0 : arguments[3];
      var bx = arguments[4] === undefined ? 32 : arguments[4];
      var by = arguments[5] === undefined ? 32 : arguments[5];

      //Create the line object
      var line = new this.Graphics();

      //Add properties
      line._ax = ax;
      line._ay = ay;
      line._bx = bx;
      line._by = by;
      line.strokeStyle = strokeStyle;
      line.lineWidth = lineWidth;

      //A helper function that draws the line
      line.draw = function () {
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
          get: function get() {
            return this._ax;
          },
          set: function set(value) {
            this._ax = value;
            this.draw();
          },
          enumerable: true, configurable: true
        },
        "ay": {
          get: function get() {
            return this._ay;
          },
          set: function set(value) {
            this._ay = value;
            this.draw();
          },
          enumerable: true, configurable: true
        },
        "bx": {
          get: function get() {
            return this._bx;
          },
          set: function set(value) {
            this._bx = value;
            this.draw();
          },
          enumerable: true, configurable: true
        },
        "by": {
          get: function get() {
            return this._by;
          },
          set: function set(value) {
            this._by = value;
            this.draw();
          },
          enumerable: true, configurable: true
        }
      });

      //Return the line
      return line;
    }
  }, {
    key: "grid",

    /* Compound sprites */

    //Use `grid` to create a grid of sprites
    value: function grid() {
      var columns = arguments[0] === undefined ? 0 : arguments[0];
      var rows = arguments[1] === undefined ? 0 : arguments[1];
      var cellWidth = arguments[2] === undefined ? 32 : arguments[2];
      var cellHeight = arguments[3] === undefined ? 32 : arguments[3];
      var centerCell = arguments[4] === undefined ? false : arguments[4];
      var xOffset = arguments[5] === undefined ? 0 : arguments[5];
      var yOffset = arguments[6] === undefined ? 0 : arguments[6];
      var makeSprite = arguments[7] === undefined ? undefined : arguments[7];
      var extra = arguments[8] === undefined ? undefined : arguments[8];

      //Create an empty group called `container`. This `container`
      //group is what the function returns back to the main program.
      //All the sprites in the grid cells will be added
      //as children to this container
      var container = new this.Container();

      //The `create` method plots the grid

      var createGrid = function createGrid() {

        //Figure out the number of cells in the grid
        var length = columns * rows;

        //Create a sprite for each cell
        for (var i = 0; i < length; i++) {

          //Figure out the sprite's x/y placement in the grid
          var x = i % columns * cellWidth,
              y = Math.floor(i / columns) * cellHeight;

          //Use the `makeSprite` function supplied in the constructor
          //to make a sprite for the grid cell
          var sprite = makeSprite();

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
            sprite.x = x + cellWidth / 2 - sprite.width / 2 + xOffset;
            sprite.y = y + cellHeight / 2 - sprite.width / 2 + yOffset;
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
  }, {
    key: "group",

    /* Groups */

    //Group sprites into a container
    value: function group() {
      for (var _len = arguments.length, sprites = Array(_len), _key = 0; _key < _len; _key++) {
        sprites[_key] = arguments[_key];
      }

      var container = new this.Container();
      sprites.forEach(function (sprite) {
        container.addChild(sprite);
      });
      return container;
    }
  }, {
    key: "batch",

    //Use the `batch` method to create a ParticleContainer
    value: function batch() {
      var size = arguments[0] === undefined ? 15000 : arguments[0];
      var options = arguments[1] === undefined ? { rotation: true, alpha: true, scale: true, uvs: true } : arguments[1];

      var batch = new this.ParticleContainer(size, options);
      return batch;
    }
  }, {
    key: "remove",

    //`remove` is a global convenience method that will
    //remove any sprite, or an argument list of sprites, from its parent.
    value: function remove() {
      for (var _len2 = arguments.length, spritesToRemove = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        spritesToRemove[_key2] = arguments[_key2];
      }

      //Remove sprites that's aren't in an array
      if (!(sprites[0] instanceof Array)) {
        if (sprites.length > 1) {
          sprites.forEach(function (sprite) {
            sprite.parent.removeChild(sprite);
          });
        } else {
          sprites[0].parent.removeChild(sprites[0]);
        }
      }

      //Remove sprites in an array of sprites
      else {
        var spritesArray = sprites[0];
        if (spritesArray.length > 0) {
          for (var i = spritesArray.length - 1; i >= 0; i--) {
            var sprite = spritesArray[i];
            sprite.parent.removeChild(sprite);
            spritesArray.splice(spritesArray.indexOf(sprite), 1);
          }
        }
      }
    }
  }]);

  return SpriteUtilities;
})();
//# sourceMappingURL=spriteUtilities.js.map