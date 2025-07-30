import toast from "react-hot-toast";
import { style } from "../constants/style.constants";
/**
 * A robust, cross-browser function to copy text to the clipboard.
 * It follows the modern standard of using the async Clipboard API first,
 * which is more secure and efficient, and then provides a fallback
 * for older browsers or insecure contexts.
 *
 * @param text The string to be copied to the clipboard.
 * @returns A Promise that resolves to `true` if successful, or `false` if not.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  // Strategy 1: Use the modern, secure Clipboard API.
  // This is the preferred method, but it only works in secure contexts (HTTPS)
  // and requires the user to grant permission.
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // The API can fail if the user denies permission or if the document is not focused.
      // We log a warning and proceed to the fallback method.
      console.warn(
        "Clipboard API failed, falling back to legacy method.",
        error
      );
    }
  }

  // Strategy 2: Fallback to the older `document.execCommand('copy')`.
  // This method works in more contexts but is less secure and is now considered a legacy feature.
  // We create a temporary, invisible textarea to hold the text for copying.
  const textArea = document.createElement("textarea");
  textArea.value = text;

  // Make the textarea invisible but still part of the DOM
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "-9999px";
  textArea.setAttribute("readonly", ""); // Prevent keyboard from showing on mobile

  document.body.appendChild(textArea);

  textArea.select();

  try {
    // Attempt to copy the selected text
    const successful = document.execCommand("copy");
    if (successful) {
      return true;
    } else {
      // This can happen if the browser blocks the command.
      console.error("Fallback copy: document.execCommand was not successful.");
      return false;
    }
  } catch (error) {
    console.error("Fallback copy failed with an exception:", error);
    return false;
  } finally {
    // Always clean up by removing the temporary textarea
    document.body.removeChild(textArea);
  }
};

// Function to ONLY copy the link
export const handleCopy = async (value: string) => {
  if (!value) return;

  const copied = await copyToClipboard(value);
  if (copied) {
    toast.success("Copied successfully", { style: style.toast });
  } else {
    toast.error("Could not copy", { style: style.toast });
  }
};
