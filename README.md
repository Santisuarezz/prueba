![Run Install](docs/images/bunnybox.png)
## Killabunnies' framework for make HTML5 videogames using [PixiJS](https://pixijs.com/ "pixijs.com").

This project is a boilerplate. The language used is [TypeScript](https://www.typescriptlang.org/ "www.typescriptlang.org"), and we recommend use [Visual Studio Code](https://code.visualstudio.com/ "code.visualstudio.com") for edit the code. Is necessary have installed [NodeJS](https://nodejs.org/ "nodejs.org") and NPM for install the dependencies (NPM are included in NodeJS installation).

## How to install

You will clone this project and use it as template. You can fork this project and use it as template for your own games easily, but we recommend clone the project. Here you have the instructions for clone:

1. Create a new repository from [GitHub](https://github.com/new "github.com/new"), for example ``my-game-name``.
2. Go to the windows console and go to the folder where you have your projects, for example ``cd Documents\Projects``
3. Clone the project with the command ``git clone git@github.com:Killabunnies/bunnybox.git my-game-name``
4. Now go to the folder of the project with the command ``cd my-game-name``
5. Remove the origin with the command ``git remote remove origin``
6. Copy the SSH URL of the new repository, from GitHub
7. Returning to cmd, add the origin of your new repository with the command ``git remote add origin <SSH URL of my-game-name>``
8. Now push the project to the new repository with the command ``git push --set-upstream origin master``

If you use a Git Client like [GitHub Desktop](https://desktop.github.com/ "desktop.github.com"), [Fork](https://git-fork.com/ "git-fork.com") or [GitKraken](https://www.gitkraken.com/ "gitkraken.com"), after all the steps, you can "add an existing repository" to work with that program from now on. They will probably offer to initialize GitLFS (This is for working with large files), just say yes.

Now we have the project cloned and ready to use, in the folder ``my-game-name``. We can open the project with Visual Studio Code, but first we must install the dependencies.

You can install or update all dependencies with the command `npm install`. Also you can click with the right button of the mouse in the file `package.json` from the `NPM SCRIPTS` tab from the EXPLORER panel of VS Code and select `Run Install`.

![Run Install](docs/images/NPMScripts.png)

After update the dependencies, you are only one step away from running the project. First, you must open the server for run the game. You can open the server with the command `npm start`. Also you can go again to the `NPM SCRIPTS` tab from the EXPLORER panel of VS Code and click `Run` button from the `start` script.

![Run start](docs/images/NPMScripts2.png)

Now we can run and debug the proyect pressing `F5` or going to the RUN AND DEBUG panel of VS Code and clicking `Start Debugging` button. We can choose the browser that we want to use for run the game, and choose if we want to run the game with clamped FPS or not.

The project will be compiled and the browser will be opened with the game running. If you edit the code, the project will be compiled again and the browser will be reloaded with the changes.

You can see another options in the panel `NPM SCRIPTS` from the EXPLORER panel of VS Code. For example, you can build the project with `build:release` or `build:debug` scripts, the project will be compiled in the `dist` folder.


## How to use the framework

First will explore the structure of the project. The main folder of the framework contains the following subfolders:
* assets: here you will put almost all your assets in the corresponding folder depending on the type of asset (images, fonts, music, sfx, etc.) 
* atlas: Here you will find more subfolders, **its important that you dont put any image here** except more folders. Inside of this folders you will put the images that you want to pack in a texture atlas. All the images used in a scene should living in the same folder. The images must be smaller than 2048 x 2048. If you need a image bigger than 2048 x 2048, you can put it in the folder `assets/images` and it will be loaded as a normal image.
* src: here we have three subfolders, but only two are important for us. The folder `engine` contains the code of the framework, tools and utils. You don't have to touch the code inside this folder, but you are free to modify according to your needs. The folder `project` will contains the code of your game. So here you will create the folders and files that you want for your game.
* node_modules: **you mustn't modify anything inside this folder. It's required for Node.js**


The framework is based on the use of scenes. Each scene is a class that extends from the class `PixiScene`. We can see an example of a scene in the files `src/project/scenes/DuckScene.ts` or `src/project/scenes/MenuScene.ts`. The scenes are managed by the class `SceneManager`. The SceneManager is the responsible of open and switch between scenes and popups. Also we can use transitions between Scenes.

The point of entry of the project is the file `src/index.ts`. Here you can see the initialization of the game, the creation of the SceneManager and the first scene that will be opened, the DuckScene 🦆, that is a demo scene along with the MenuScene. You can delete the DuckScene and the MenuScene and create your own scenes but it's recommended that you keep the MenuScene as a template for your own scenes.

You can also access both scenes, both at the execution level and in the code. To see what they do and how they do it.

### Demo Scenes:

* DuckScene: is a demo of PixiJS, [Pixi3D](https://pixi3d.org/ "pixi3d.org") and Tweens from [Tweedle.js](https://miltoncandelero.github.io/tweedle.js/ "miltoncandelero.github.io/tweedle.js"). Shows also a magical masking effect. 
* MenuScene: is a demo that contains a StateMachineAnimator, a Timer, SoundLib, localizated strings, and a a pointer event. (you can delete all content of the class for reuse it as a real MenuScene)
* I promise that I will create more demo scenes in the future :)

## Assets

Any asset you want to add to the project, besides having it added in the asset folder and its corresponding subfolder, you will need to declare it in the assets.jsonc file so that the framework's loader can load it correctly. The file itself will guide you on how to declare the files with the comments inside.

Inside the assets.jsonc file you will include all your assets in a bundles. With this bundles you can load your game by parts. For example: a bundle for a MenuScene assets, a bundle for a GameScene assets, so you can reduce the loading time of your game dividing the loading time by scenes.

After knowing that you must include what bundles you will include in your scenes declarating them in your PixiScene class with the next format:

```typescript
export class MenuScene extends PixiScene {
	public static readonly BUNDLES = ["music", "package-1"];
    ...
}
```

And inside of your assets.jsonc have this:

```jsonc
{
	"bundles": [
		{
			"name": "music",
			"assets": {
				"music": "./music/musical.mp3"
			}
		},
		{
			"name": "package-1",
			"assets": {
				"big_background": "./img/big_placeholder/bg_game.png",
			}
		}
	]
}
```

And the atlas will appear into a package with the same name automatically also!

You can use a image from assets/img or from a subfolder of atlas but next we will explain how works the atlas

## Atlas

The texture atlas is one or more images generated by merging the assets contained in the atlas subfolders. The result of the merge will not be visible in a folder, not even to the developer, as both the transformation of the assets into an atlas and the identification of their coordinates within the texture atlas will be done automatically. It is important to note that texture atlases have a maximum resolution of 2048x2048. So, if you want to use an image with a higher resolution, you should place it in the assets/img folder.

If it is a large image, such as a background, or an image that needs to be tiled, like a TilingSprite, you are probably trying to load the image from assets.

For other cases of images, it is recommended to place them in the atlas folder.

How to use one method or the other?

If you want to load a Sprite from assets, you need to declare it in assets.jsonc within the bundle (which you should declare in your PixiScene, don't forget!), and then instantiate it from the code in the following way:

```typescript
const spr: Sprite = Sprite.from("big_background");
```

Now if you want to load a Sprite from the atlas, you don't need to declare it in assets. Instead, you simply instantiate it from the code in the following way:

```typescript
const spr: Sprite = Sprite.from("package-1/bronze_1.png");
```

And boila! The framework will load the atlas and the image for you!

## Links

* BunnyBox page: https://bunnybox.games/
* Our Discord: https://discord.gg/nxyVpsR7
* PixiJS Documentation:
	1. https://pixijs.download/dev/docs/index.html
	2. https://api.pixijs.io/
	3. https://www.pixijselementals.com/
* Pixi3D: https://pixi3d.org/
* PixiSound: https://www.npmjs.com/package/pixi-sound
* Tweedle.js: https://miltoncandelero.github.io/tweedle.js/
* Box2D js: 
	1. https://www.npmjs.com/package/box2d-wasm
	2. https://box2d.org/ (original)


TODOs :)\
license\
fonts\
flags\
tweens\
Documentation\
examples\
tutorials
