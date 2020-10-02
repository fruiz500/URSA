# URSA
Symmetric encryption part of PassLok, just by itself

URSA is essentially a subset of [PassLok](https://github.com/fruiz500/passlok), also available on GitHub, including the symmetric encryption mode plus one text steganography algorithm. It is designed for extreme simplicity.

These are the principles guiding the design of URSA:
* Perfect portability. Runs on any computer or mobile device.
* Completely self-contained so it runs offline. No servers.
* Easy to understand and use by novices. Single-page graphical interface. No crypto jargon.

Because of this, URSA is pure html code consisting mostly of JavaScript instructions. Its cryptography code is based on Tweet NaCl, also on GitHub. It uses XSalsa20 for symmetric encryption.

These are the open source libraries used in URSA, which can be found in the js-opensrc directory:
* Tweet NaCl in JavaScript: https://github.com/dchest/tweetnacl-js
* SCRYPT key stretching, edited to make it synchronous. https://github.com/dchest/scrypt-async-js
* DOMPurify, used to sanitize decrypted material before putting in DOM v2.1.1. https://github.com/cure53/DOMPurify
* jpeg image steganography by Owen Campbell-Moore and others. https://github.com/owencm/js-steg

The URSA original code is in directories js-head and js-body (note: names are the same as their PassLok equivalents, but they are different libraries):
* this only loads two word arrays: wordlist and blacklist: dictionary_en.js
* Key and Lock functions: keylock.js
* cryptographic functions: crypto.js
* extra functions for mail, etc.: mail&chat.js
* functions for switching screens, etc.: screens.js
* text steganograghy: textstego.js
* image steganography: imagestego.js and imageextra.js
* window reformatting, special functions: bodyscript.js
* initialization, button connections: initbuttons.js

Full documentation can be found at: <http://ursa-app.weebly.com/>, and then there is the PassLok site, including:
* PassLok technical design document: http://www.weebly.com/uploads/2/4/1/8/24187628/passlok_technical_document.pdf
* and a number of articles and video tutorials.

License
-------

  Copyright (C) 2015 Francisco Ruiz

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <http://www.gnu.org/licenses/>.

Acknowledgements
----------------

  URSA contains and/or links to code from a number of open source
  projects on GitHub, including the Tweet NaCl crypto library, and others.

Cryptography Notice
-------------------

  This distribution includes cryptographic software. The country in
  which you currently reside may have restrictions on the import,
  possession, use, and/or re-export to another country, of encryption
  software. BEFORE using any encryption software, please check your
  country's laws, regulations and policies concerning the import,
  possession, or use, and re-export of encryption software, to see if
  this is permitted. See <http://www.wassenaar.org/> for more
  information.

  The U.S. Government Department of Commerce, Bureau of Industry and
  Security (BIS), has classified this software as Export Commodity
  Control Number (ECCN) 5D002.C.1, which includes information security
  software using or performing cryptographic functions with asymmetric
  algorithms. The form and manner of this distribution makes it
  eligible for export under the License Exception ENC Technology
  Software Unrestricted (TSU) exception (see the BIS Export
  Administration Regulations, Section 740.13) for both object code and
  source code.


