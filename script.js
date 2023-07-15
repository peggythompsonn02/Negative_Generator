document.getElementById('pdfForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent form submission

  var files = document.getElementById('pdfInput').files;
  if (files.length === 0) {
    alert('Please select at least one PDF file.');
    return;
  }

  var separator = document.getElementById('separatorInput').value;

  var outputText = document.getElementById('outputText');
  outputText.textContent = 'Generating...';

  var texts = []; // Array to store extracted text

  // Function to handle the reading of each file
  function handleFileRead(fileReader) {
    return function() {
      var typedArray = new Uint8Array(this.result);
      // Load the PDF using pdf.js
      pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
        var numPages = pdf.numPages;
        var pageTextPromises = [];
        for (var i = 1; i <= numPages; i++) {
          // Extract text from each page using pdf.js
          pageTextPromises.push(pdf.getPage(i).then(function(page) {
            return page.getTextContent().then(function(textContent) {
              var pageText = '';
              for (var j = 0; j < textContent.items.length; j++) {
                pageText += textContent.items[j].str + ' ';
              }
              return pageText.trim();
            });
          }));
        }

        // Wait for all page text promises to resolve
        Promise.all(pageTextPromises).then(function(pageTexts) {
          // Concatenate the text from all pages
          var mergedText = pageTexts.join('\n');
          texts.push(mergedText);

          if (texts.length === files.length) {
            // Merge all text files into one
            var finalText = texts.join('\n\n');
            var separatedText = separateLines(finalText, 10, separator);
            outputText.textContent = separatedText;

            var copyButton = document.getElementById('copyButton');
            copyButton.disabled = false;
          }
        });
      });
    };
  }

  // Read each file using FileReader
  for (var i = 0; i < files.length; i++) {
    var fileReader = new FileReader();
    fileReader.onloadend = handleFileRead(fileReader);
    fileReader.readAsArrayBuffer(files[i]);
  }

  // Function to insert separator after every n lines
  function separateLines(text, lines, separator) {
    var linesArray = text.split('\n');
    for (var i = lines; i < linesArray.length; i += lines + 1) {
      linesArray.splice(i, 0, separator);
    }
    return linesArray.join('\n');
  }
});

document.getElementById('copyButton').addEventListener('click', function() {
  var outputText = document.getElementById('outputText');
  var range = document.createRange();
  range.selectNode(outputText);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  document.execCommand('copy');
  window.getSelection().removeAllRanges();
  alert('Output text copied to clipboard!');
});
