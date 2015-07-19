Pixi Sprite Utilities
=====================

This repository contains a bunch of useful functions for creating
[Pixi](https://github.com/GoodBoyDigital/pixi.js/) sprites and making them easier to work with.

The `sprite` function
-------------------

Use the universal `sprite` function to make any kind of Pixi sprite.
```js
let anySprite = sprite(frameTextures, xPosition, yPosition);
```
The first argument, `frameTextures` can be any of the following: 

-	A single PNG image string.
-	A Pixi `Texture` object.
-	An array of texture atlas frame ids.
-	An array of single PNG image strings.
-	An array of Pixi `Texture` objects.

You can essentially throw anything at it, and it will give you back a sprite that works as it should, 
depending on the kind of texture information you've supplied. That
means you can use the `sprite` function 
as your one-stop-shop for creating any kind of sprite. Forget about
using Pixi's `Sprite` and `MovieClip` 
classes to make sprites and just use the `sprite` function for everything!

If you supply the `sprite` function with an array, it will return a
`MovieClip` sprite but with a bonus 
**state player**  built into it. The state player is just a collection of 4 properties and methods 
that make it easy to control sprite animation states. Here they are:

1. `fps`: A property to set the precise animation speed, as
frames-per-second. Its default value is 12. The `fps` is not linked to
the renderer's fps, and that means you can have sprite animations
playing at speeds that are independent of the game or application
speed. `anySprite.fps = 6`.

2. `playAnimation`: A method to play the sprite's
animation.`anySprite.playAnimation()`. You can supply it with start and end frame values if you want to play a sub-set of frames. Here's how: `anySprite.playAnimation([startFrame, endFrame])` The animation will play in a loop, by default, unless you set the sprite's `loop` property value to `false`.

3. `stopAnimation`: A method that stops the sprite's animation at the
current frame. `anySprite.stopAnimation()`.

4. `show`: A method that displays a specific frame number.
`anySprite.show(frameNumber)`.

`filmstrip`
----------

Use the`filmstrip` function to automatically turn a tileset PNG image
into an array of textures that you can use to make a sprite.
```js
filmstrip("anyTilesetImage.png", frameWidth, frameHeight, optionalPadding);
```
Supply `filmstrip` with the tileset image name and the width and
height of each frame. If there's padding around each frame, supply the
padding amount, in pixels. `filmstrip` returns an array of frames that
you can use to make an animated `MovieClip` sprite. 
Here's how you could use `filmstrip` with the universal `sprite`
function to quickly make a sprite with multiple frames: 
```js
let textures = filmstrip("tileset.png", 32, 32);
let anySprite = sprite(textures);
```
The `filmstrip` function automatically loads every frame from a tileset image into the sprite.

`frames`
-------

But what if you only want to use a sub-set of frames from the tileset,
not all of them? Use another utility function called `frames`. The
`frames` function takes 4 arguments: the texture, a 2D array of x/y
frame position coordinates, and the width and height of each frame.
Here's how you could use the frames function to create a sprite.
```js
let textures = frames(
  "tileset.png",             //The tileset image
  [[0,0],[32,0],[64,0]],     //A 2D array of x/y frame coordianates
  32, 32                     //The width and height of each frame
);
let anySprite = sprite(textures);
```
Use the `frames` function whenever you need to create a sprite using
selected frames from a larger tileset PNG image.

`frame`
-------

Use the `frame` function if you just want to create a texture using a smaller
rectangular section of a larger image. The `frame` function takes
four arguments: the image, the sub-image x position, the sub-image y
position, and the sub-image's width and height.
```
frame("image.png", x, y, width, height)
```
Here's how you could make a sprite using a sub-image of a larger
image. 
```js
let texture = frame("tileset.png", 64, 128, 32, 32);
let anySprite = sprite(texture);
```
Use the `frame` function to
[blit](https://en.wikipedia.org/wiki/Bit_blit) a smaller image from bigger image.







