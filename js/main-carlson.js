// Entry point for carlson.html: install the Linger Cup theme, then load the shared game.
import { setTheme } from './theme.js';
import { carlsonTheme } from './themes/carlson.js';

setTheme(carlsonTheme);
await import('./main.js');
