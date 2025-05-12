# encryptit - secure client-side file encryption

**encryptit** is a web-based tool that allows you to securely encrypt and decrypt your files and folders directly in your browser. your data never leaves your device, ensuring maximum privacy and security.

## current status

**encryptit is currently in active development.** while it is functional, you may encounter bugs or find areas for improvement. user feedback is welcome.

you can try the current version at: [https://rossi.nz/mine/encryptit](https://rossi.nz/mine/encryptit)

## features

* **client-side encryption/decryption:** all cryptographic operations happen locally in your web browser using the standard web crypto api. your files and passwords are **never** uploaded to any server.
* **file & folder support:**
    * encrypt single or multiple files.
    * encrypt entire folders (folder structure is preserved within the encrypted archive).
* **strong encryption:**
    * uses **aes-gcm (256-bit)**, a modern and secure authenticated encryption algorithm.
    * derives encryption keys from your password using **pbkdf2 (sha-256)** with a high iteration count (100,000+) to protect against brute-force attacks.
    * uses unique **salts** for each encryption, enhancing security even if the same password is reused.
    * generates a unique **initialization vector (iv)** for each encryption operation.
* **archive format:**
    * encrypts multiple files/folders into a single `.encryptit` archive file.
    * uses jszip to package files (with deflate compression) before encryption, making the output compact.
* **user-friendly interface:**
    * modern, clean design with intuitive drag-and-drop support for files and folders.
    * option to click and select files or folders.
    * clear visual feedback with a **progress bar** during encryption and decryption.
    * informative status messages for guidance and error reporting.
* **no installation required:** being entirely web-based, there's nothing to install. just open the html file in a modern browser.
* **open source potential:** designed with transparency in mind, making it suitable for open-sourcing to build user trust.

## how it works (quick overview)

**encryptit** leverages modern web technologies to perform all operations securely on the client-side:

### encryption process:

1.  **file input:** you select files or folders via drag-and-drop or the selection buttons.
2.  **password prompt:** you provide a strong password. a unique output filename (e.g., `myarchive.encryptit`) is suggested or can be set by you.
3.  **file packaging (jszip):**
    * if multiple files or folders are selected, they are first packaged into a single zip archive in memory using jszip. folder structures are maintained within this archive.
    * the archive is compressed (deflate) to reduce size.
4.  **key derivation (web crypto api - pbkdf2):**
    * a cryptographically secure random **salt** (16 bytes) is generated.
    * your password and this salt are fed into the pbkdf2 algorithm (with sha-256 and 100,000+ iterations) to derive a strong 256-bit aes encryption key.
5.  **encryption (web crypto api - aes-gcm):**
    * a cryptographically secure random **initialization vector (iv)** (12 bytes) is generated.
    * the (zipped) file data is encrypted using aes-gcm with the derived key and iv. aes-gcm provides both confidentiality and authenticity.
6.  **output file creation:**
    * the final `.encryptit` file is constructed by concatenating: `salt + iv + encrypted data`.
    * this file is then made available for you to download.

### decryption process:

1.  **file input:** you select one or more `.encryptit` files.
2.  **password prompt:** you enter the master password that was used to encrypt those files.
3.  **data extraction:** for each `.encryptit` file:
    * the file is read into memory.
    * the **salt** (first 16 bytes) and **iv** (next 12 bytes) are extracted from the beginning of the file. the remaining data is the ciphertext.
4.  **key derivation (web crypto api - pbkdf2):**
    * the extracted salt and your provided password are used with pbkdf2 (same parameters as encryption) to re-derive the original aes encryption key.
5.  **decryption (web crypto api - aes-gcm):**
    * the ciphertext is decrypted using aes-gcm with the derived key and the extracted iv. if the password is incorrect or the data is tampered with, this step will fail.
6.  **file unpackaging (jszip):**
    * the decrypted data (which is a zip archive) is loaded using jszip.
    * each file and folder is extracted from the archive.
7.  **download:** each original file is then made available for you to download, preserving its original name and (if applicable) folder structure relative to the archive root.

this client-side approach ensures that your sensitive data and passwords are never transmitted over the network, providing a high level of privacy and security.

## future features

as **encryptit** is still under development, here are some planned enhancements:

* **mobile support:** improve responsiveness and usability on mobile devices and tablets.
* **ui/ux enhancements:** continuously refine the user interface and experience for even greater ease of use and visual appeal. this includes better error state handling and more interactive elements.
* **ongoing bug fixing:** address any reported bugs and improve overall stability and performance.
* **web workers for performance:** move cryptographic and zipping operations to web workers to prevent ui freezing with very large files or many files.
* **streaming support:** explore using streams for encryption/decryption of very large files to reduce memory footprint.
* **password strength meter:** provide visual feedback on the strength of the chosen password.
* **localization:** support for multiple languages.
