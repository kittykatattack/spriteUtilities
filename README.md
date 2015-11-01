Pixi Sprite Utilities
=====================

This repository contains a bunch of useful functions for creating
[Pixi](https://github.com/GoodBoyDigital/pixi.js/) sprites and making them easier to work with.

[Setting up](#settingup) <br>
[sprite: Quickly make any Sprite or MovieClip](#sprite)<br>
[filmstrip: Turn any tileset PNG into a texture array](#filmstrip)<br>
[frames: Capture a subset of frames from a PNG tileset](#frames)<br>
[frame: Capture a single rectangular area inside PNG image or
tileset](#frame)<br>
[frameSeries: Captures a sequence of numbered frame ids from a
textureatlas](#frameSeries)<br>
[text: Make a text sprite](#text)<br>
[bitmaptext: Make a bitmaptext sprite](#bitmaptext)<br>
[rectangle: Draw a rectangle](#rectangle)<br>
[circle: Draw a circle](#circle)<br>
[line: Draw a line](#line)<br>
[grid: Create a grid of sprites](#grid)<br>
[group: Group sprites](#group)<br>
[batch: Create a particle container](#batch)<br>
[remove: Remove a sprite or array of sprites from its parent](#batch)<br>

<a id="settingup"></a>
Setting up and initializing `SpriteUtilities`
-------------------------------------------

Create a new instance of `SpriteUtilities` like this:
```js
let u = new SpriteUtilities(PIXI);
```
Supply a reference to `PIXI` as the optional argument in the
constructor. (If you don't supply it, `SpriteUtilites` will look for a
global `PIXI` object and alert you with an error if it can't find it.)

You can now access the `SpriteUtilites` instance and all its
methods using the variable reference `u`.

<a id="sprite"></a>
The `sprite` function
-------------------

Use the universal `sprite` function to make any kind of Pixi sprite.
```js
let anySprite = u.sprite(frameTextures, xPosition, yPosition);
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

5. `animating`: A Boolean property that will be `true` if the
animation is playing and `false` if it isn't.

<a id="filmstrip"></a>
`filmstrip`
----------

Use the`filmstrip` function to automatically turn a tileset PNG image
into an array of textures that you can use to make a sprite.
```js
u.filmstrip("anyTilesetImage.png", frameWidth, frameHeight, optionalPadding);
```
Supply `filmstrip` with the tileset image name and the width and
height of each frame. If there's padding around each frame, supply the
padding amount, in pixels. `filmstrip` returns an array of frames that
you can use to make an animated `MovieClip` sprite. 
Here's how you could use `filmstrip` with the universal `sprite`
function to quickly make a sprite with multiple frames: 
```js
let textures = u.filmstrip("tileset.png", 32, 32);
let anySprite = u.sprite(textures);
```
The `filmstrip` function automatically loads every frame from a tileset image into the sprite.

<a id="frames"></a>
`frames`
-------

But what if you only want to use a sub-set of frames from the tileset,
not all of them? Use another utility function called `frames`. The
`frames` function takes 4 arguments: the texture, a 2D array of x/y
frame position coordinates, and the width and height of each frame.
Here's how you could use the frames function to create a sprite.
```js
let textures = u.frames(
  "tileset.png",             //The tileset image
  [[0,0],[32,0],[64,0]],     //A 2D array of x/y frame coordianates
  32, 32                     //The width and height of each frame
);
let anySprite = u.sprite(textures);
```
Use the `frames` function whenever you need to create a sprite using
selected frames from a larger tileset PNG image.

<a id="frame"></a>
`frame`
-------

Use the `frame` function if you just want to create a texture using a smaller
rectangular section of a larger image. The `frame` function takes
four arguments: the image, the sub-image x position, the sub-image y
position, and the sub-image's width and height.
```
u.frame("image.png", x, y, width, height)
```
Here's how you could make a sprite using a sub-image of a larger
image. 
```js
let texture = u.frame("tileset.png", 64, 128, 32, 32);
let anySprite = u.sprite(texture);
```
Use the `frame` function to
[blit](https://en.wikipedia.org/wiki/Bit_blit) a smaller image from bigger image.

<a id="frameSeries"></a>
`frameSeries`
------------

If you've loaded a texture atlas and want a sequence of numbered frame
ids to create an animated sprite, use the `frameSeries` function.
Imagine that you have frames in a texture atlas with the following id
names:
```js
frame0.png
frame1.png
frame2.png
```
To create a sprite in Pixi using these frames, you would ordinarily
write some code using Pixi's `MovieClip` class
(`PIXI.extras.MovieClip`) that looks something like this:
```js
let frameTextures = ["frame0.png", "frame1.png", "frame2.png"];
let anySprite = MovieClip.fromFrames(frameTextures);
```
You now have a sprite with 3 frames that you can control. That's not too painful, but what if you
had 100 animation frames? You definitely don't want to manually type in
100 frame id's into an array. Instead, use the `frameSeries` function.

`frameSeries` takes four arguments: the start frame sequence number,
the end frame sequence number, the optional base file name, and the optional file extension.
You could use the `frameSeries` function to create the sprite from the
texture atlas frame ids like this:
```
let frameTextures = u.frameSeries(0, 2, "frame", ".png");
let anySprite = u.sprite(frameTextures);
```
If you had 100 animation frames, your code might look like this:
```
let frameTextures = u.frameSeries(0, 99, "frame", ".png");
let anySprite = u.sprite(frameTextures);
```
That's much better!

<a id="text"></a>
`text`
------

Use the `text` method to quickly create a text sprite.
```js
let messgae = u.text("Hello!", "32px Futura", "black", xPosition, yPosition); 
```
Only the first argument, the text you want to display, is required.
The second argument is the font size and family. You can use any
system font, or a font from a loaded font file. The thrid argument is the
fill color. Text colors can provided as RGBA, HLSA, hexadecimal,
or HTML color string values, such as “blue” or “green.” The last
arguments are the text's x and y position.

You can add any additional Pixi text properties by setting the text sprite's
`style` property.
```js
message.style = {fill: "black", font: "16px Helvetica"}; 
```
Check out the [full list of Pixi Text properties](http://pixijs.github.io/docs/PIXI.Text.html) to find out
which styles you can apply.

To change the text display at any time, use the text's `content` property.
```js
message.content = "Updated text!";
```

<a id="bitmaptext"></a>
`bitmapText`
-----------

Bitmap text is text that is rendered using images for the letter
shapes. (Ordinary font files just contain instructions about how 
your computer should draw the font shapes.) Bitmap fonts need to load the
image and data files containing the letter shapes, but they tend to
display more reliably across different platforms.

The `bitmapText` method lets you quickly create a bitmap text sprite,
like this:
```js
let message = u.bitmapText("Hello!", "42px disko", align, tint, xPosition, yPosition); 
```
Only the first argument, the text to display, is required. The second
argument is the font size and family. 

The third argument is the alignment, which determines how the text
should be displayed if it appears on more than one line. Alignment
values can be any of these three strings: "left", "right" or "center".

The fourth argument, tint, is the color that the font should be
tinted. This can be any RGBA, HLASA, Hex, or HTML string color value.

Finally, the last two values are the text's x and y position values.

<a id="rectangle"></a>
`rectangle`
----------

The `rectangle` method lets you quickly draw a rectangle.
```js
u.rectangle(
  width, height, fillStyle, strokeStyle, lineWidth, xPosition, yPosition
);
```
`width` and `height` are the size, in pixels, of the rectangle.
They're the only two arguments that are required.
`fillStyle` is a hexadecimal color code for the inside fill color of the
rectangle, and `strokeStyle` is the hex color code for the outline.
`lineWidth` determines how thick, in pixels, the rectangle's outline
should be. (The default value is 0, which means the rectangle will have
no outline.) The last two values are the rectangle's x and y
position.

Here's how to use the `rectangle` method to create a black square
with a 2 pixel wide red outline:
```js
let square = u.rectangle(64, 64, "0x000000", "0x0033CC", 2);
```
(Because the last two arguments, x and y, haven't been provided, the
rectangle will have default x and y values of 0.)

<a id="circle"></a>
`circle`
-------

Use the `circle` method to draw a circle.
```js
u.circle(diameter, fillStyle, strokeStyle, lineWidth, xPosition, yPosition)
```
The arguments are similar to the `rectangle` method's arguments,
except that the fist one is the diameter, in pixels, of the circle you
want to draw. Here's how to draw a white circle with a diameter of 64
pixels and a red outline 3 pixels wide.
```js
let ball = u.circle(64, "0xFFFFFF", "0x0033CC", 3);
```
A circle's x and y position is anchored to the top left corner of an
invisible rectangular bounding box that is surrounding the circle. To
set the x and y position to the center of the circle, use the
`anchor.set` method:
```js
ball.anchor.set(0.5, 0.5);
```
This sets the `x` and `y` positions to `0.5`, which means "the
positions that are at half the circle's width and height". In other
words, its center.

<a id="line"></a>
`line`
-----
The `line` method lets you quickly draw a straight line.
```js
u.line(color, width, ax, ay, bx, by)
```
The `color` should be a hexadecimal color value. The last four arguments define the line's start and end points. `ax`
and `ay` are it's start point; `bx` and `by` are it's end points.
Here's how to create black line, 3 pixels wide, with a start x/y point
of 64 and and an end x/y point of 128.

```js
let diagonal = u.line(0x000000, 3, 64, 64, 128, 128);
```
You can change the start and end points at any time. Here's how you
set the line's end point to an x position of 100 and a y position of
90.
```js
diagonal.bx = 100;
diagonal.by = 90;
```
The line will be re-drawn to these coordinates as soon as you set
them.

<a id="grid"></a>
`grid`
-----

`grid` is a very useful method that plots a grid of sprites for you. It
returns a Pixi container object and fills it with a grid of sprites -
any kind of sprite you need. Here's an example of how to use it to
plot a 5 by 4 grid of black circles.

```js
let circles = u.grid(
  5,    //The number of columns
  4,    //The number of rows
  48,   //The width of each cell
  48,   //The height of each cell
  true, //Should the sprite be centered in the cell?
  0,    //The sprite's xOffset from the left of the cell 
  0,    //The sprite's yOffset from the top of the cell

  //A function that describes how to make each peg in the grid. 
  //A random diameter and color are selected for each one
  () => {
    let ball = u.circle(24, 0x000000);
    return ball;
  },

  //Run any optional extra code after each //peg is made
  () => console.log("extra!")
);

```
The `grid` method returns a Pixi `Container` object called `circles`. All the sprites
inside each cell of the grid are children of that `circles` Container.
Because it’s a Container, you can manipulate the entire grid just like any
other sprite. That means you can set its `x` and `y` position
values to move the grid around the canvas. (The default x/y position
is 0.)

You can access the individual sprites in the grid through the
Container's `children` array property.
```js
circles.children
```
Just loop through the `children` array to set or access any properties
of sprites in the grid.

<a id="group"></a>
`group`
------

A quick way to make a Pixi `Container` and add sprites to it. Just supply
the `group` method with a single spirte, or a list of sprites, and it
will return a container with those sprites as its children.
```
let container = u.group(spriteOne, spriteTwo, spriteThree);
```
You can alternatively create an empty group, and add sprites to it as you
need to using `addChild`, like this:
```
let container = u.group();
container.addChild(anySprite);
```

<a id="batch"></a>
`batch`
-------

A quick way to create a Pixi `ParticleContainer`.
```
let particleContainer = u.batch();
particleContainer.addChild(anySprite);
```
You can optionally create the batch with two arguments: the maximum
number of sprites the container can inclue and the `ParticleContainer`
object's `options`. Here's how to create a particle container with a
maximum number of 20,000 sprites, and all the options set to `true`
```js
let particleContainer = u.batch(20000, {rotation: true, alpha: true, scale: true, uvs: true});
```
The default size is 15,000. So, if you have to contain more sprites,
set it to a higher number. The `options` argument is an object with
five Boolean properties that you can set: `scale`, `position`,
`rotation`, `alpha`, and `uvs`. The default value for position is `true`, but all
the others are set to `false`. 

<a id="remove"></a>
`remove` 
-------
`remove` is a global convenience method that will remove any sprite, or an
argument list of sprites, from its parent.
```
u.remove(spriteOne, spriteTwo, spriteThree);
```
This is really useful because you never need to know what the sprite's
parent is.

You can also remove a whole array of sprites from their parents, like
this:
```js
u.remove(arrayOfSprites);
```
Easy!







