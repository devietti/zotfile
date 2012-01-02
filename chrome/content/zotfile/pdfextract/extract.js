/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

//
// See README for overview
//

'use strict';

Zotero.ZotFile.PdfExtractor = {

  extractAnnotations: function(args) {
    PDFJS.getPdf(
      {
        url: args.url,
        progress: function getPdfProgress(evt) {
          //if (evt.lengthComputable) alert("progress: " + (evt.loaded / evt.total));
        },
        error: function getPdfError(e) {
          Components.utils.reportError("pdf error: " + args.url + " " + e.target + " " + e.target.status);
        }
      },
      function getPdfLoad(data) {
        var pdf = new PDFJS.PDFDoc(data);
        var pageOne = pdf.getPage(1);
        var metadata = pdf.pdf.xref.fetch( {num:1, gen:0}, false );
        if ('map' in metadata) {
          var Author = metadata.map.Author ? pdf.pdf.xref.fetch( metadata.map.Author, false ) : "";
          var Title = metadata.map.Title ? pdf.pdf.xref.fetch( metadata.map.Title, false ) : "";
          var Keywords = metadata.map.Keywords ? pdf.pdf.xref.fetch( metadata.map.Keywords, false ) : "";
        }
        
        // Prepare canvas using PDF page dimensions
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        var annotations = [];
        var pageNum = 1;
        var currentPage = pageOne;

        var renderingDone = function(err) {
          //alert("renderingDone() page " + pageNum + " of " + pdf.numPages); // jld
          
          if (err || !currentPage.extractedAnnotations) {
            Components.utils.reportError('An error occurred while rendering page ' + pageNum + " of " + args.url + " " + err);
            return;
          }
          for each (var annot in currentPage.extractedAnnotations) {
            var a = {};
            a.filename = args.url; // TODO: basename instead?
            a.page = pageNum;
            a.type = annot.type;
            a.content = annot.content;
            annotations.push(a);
            // if (annot.type && annot.type == "Highlight") { // jld
            //   if ('content' in annot) alert("highlight: " + annot.content);
            // }
          }
          
          pageNum++;
          if (pageNum > pdf.numPages) {
            args.callback.call(args.callbackObj, annotations, args.item);
          } else {
            currentPage = pdf.getPage(pageNum);
            // NB: highlight annotation extraction currently requires scale == 1.0
            var scale = 1.0;
            canvas.height = currentPage.height * scale;
            canvas.width = currentPage.width * scale;

            currentPage.startRendering(context, renderingDone);
          }
        };

        // NB: highlight annotation extraction currently requires scale == 1.0
        var scale = 1.0;
        canvas.height = pageOne.height * scale;
        canvas.width = pageOne.width * scale;

        currentPage.startRendering(context, renderingDone);

      });
  } // extractAnnotations()
};