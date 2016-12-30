var generateQuery = function(target) {
    getCheckboxStatus(target);
};

var getCheckboxStatus = function(target) {
    var checkboxes = document.getElementsByName(target);

    var variables = [];

    for (var i = 0; i < checkboxes.length; i++) {
        var checkbox = checkboxes[i];

        if (checkbox.checked) {
            var currentRow = checkbox.parentNode.parentNode;
            var variableNameColumn = currentRow.getElementsByTagName("td")[2];
            var analysisNameColumn = currentRow.getElementsByTagName("td")[7];

            variables.push({
                'variable': variableNameColumn.textContent,
                'analysis': analysisNameColumn.textContent
            });
        }        
    } 

    displayOutput(variables);

};

var checkAll = function(selector, target) {
    // Get checked/unchecked status from selection button and apply the same status to all checkboxes in a table
    var selectionStatus = selector.checked;
    var checkboxes = document.getElementsByName(target);

    for (var i = 0; i < checkboxes.length; i++)
        checkboxes[i].checked = selectionStatus;
};

var displayOutput = function(content) { // Expects content to be an 1-dim array containing objects with properties 'analysis' and 'variable'
    var outputArea = $('#output');
    outputArea.html("");

    for (item in content)
        outputArea.html(outputArea.html() + content[item].analysis + " - " + content[item].variable + "<br>");
};