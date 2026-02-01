const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { pdf, Document, Page, Text, View } = require('@react-pdf/renderer');

// Test simple PDF generation
async function testPDF() {
  try {
    const TestDoc = () => (
      React.createElement(Document, {},
        React.createElement(Page, { size: "A4" },
          React.createElement(View, {},
            React.createElement(Text, {}, "Test PDF")
          )
        )
      )
    );

    const doc = React.createElement(TestDoc);
    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    console.log('✅ PDF generation works! Blob size:', blob.size);
  } catch (error) {
    console.error('❌ PDF generation error:', error);
  }
}

testPDF();