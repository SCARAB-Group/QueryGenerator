/**
 * NOTE: all functions called getXXXQuery... are to be considered temporary as these only return text strings that build up the
 * SQL queries for the data requests. They are full of special case handling and overall these string resources should be fetched
 * from a backend service instead. Also, the order document/main website page should be looked at and probably adjusted a bit in
 * order to avoid some of the special case handling.
 */

$(function () {

    $('#theForm').on('submit', function (e) {
        if (!e.isDefaultPrevented()) {
            generateQuery(["EPH_PHYS_LIMS", "EPH_PHYS_EKG", "EPH_PHYS_BLOOD"]);
            return false;
        }
    })
});

var generateQuery = function(targetList) {

    var selectedVariables;
    var query = "";
    var currentTarget;

    for (var t in targetList) {
        currentTarget = targetList[t];
        selectedVariables = getSelectedVariables(currentTarget);

        if (selectedVariables.length > 0) {
            switch (currentTarget) {
                case "EPH_PHYS_LIMS":
                    query += addRequestIdAndComment(getLIMSQueryTop() + getLIMSSelects(selectedVariables) + getLIMSQueryBottom())
                    break;

                case "EPH_PHYS_EKG":
                    console.log(selectedVariables)
                    query += "<br><br>" + addRequestIdAndComment(getEKGQueryTop() + getEKGQuerySelects(selectedVariables) + getEKGQueryBottom())
                    break;

                case "EPH_PHYS_BLOOD":
                    query += "<br><br>" + addBloodAnalysisFilters(getBloodQueryTop() + getBloodQueryBottom(), selectedVariables);
                    break;

                default:
                    break;
            }
        }
    }
     
    displayOutput(query);
    document.getElementById("output").scrollIntoView();
};

var getSelectedVariables = function(target) {
    var checkboxes = document.getElementsByName(target);

    var variables = [];

    for (var i = 0; i < checkboxes.length; i++) {
        var checkbox = checkboxes[i];

        if (checkbox.checked) {
            var currentRow = checkbox.parentNode.parentNode;
            var variableNameColumn = currentRow.getElementsByTagName("td")[2];
            var analysisNameColumn = currentRow.getElementsByTagName("td")[7];

            console.log(checkbox.nodeName);

            variables.push({
                'variable': variableNameColumn.textContent,
                'analysis': analysisNameColumn.textContent
            });
        }        
    }

    return variables;
};

var checkAll = function(selector, targetList) {
    // Get checked/unchecked status from selection button and apply the same status to all checkboxes in a table
    var selectionStatus = selector.checked;

    for (var index in targetList) {
        var checkboxes = document.getElementsByName(targetList[index]);

        for (var i = 0; i < checkboxes.length; i++)
            checkboxes[i].checked = selectionStatus;
    }
};

var addRequestIdAndComment = function(queryString) {
    return queryString.replace("#REQUEST_ID#", $('#dataRequestId').val()).replace("#REQUEST_COMMENT#", $('#dataExtractionComment').val())
};

var displayOutput = function(content) { // Expects content to be an 1-dim array containing objects with properties 'analysis' and 'variable'
    var outputArea = $('#output');
    outputArea.html("");
    outputArea.html(content);
};

// ful-variant, detta kanske ska läsas från en fil eller backend istället :)
var getLIMSQueryTop = function() {
    return "SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;<br><br>"
        + "DECLARE<br>"
        + "@StudyRequestId nvarchar(20)<br>"
        + ",@RequestComment nvarchar(255)<br>"
        + ",@StudyName nvarchar(20)<br><br>"
        + "IF object_id('tempdb..#TempData','U') IS NOT NULL DROP TABLE #TempData<br>"
        + "IF object_id('tempdb..#BaseData','U') IS NOT NULL DROP TABLE #BaseData<br><br>"
        + "--	Study<br>"
        + "SET @StudyName = 'EpiHealth'<br>"
        + "--Data Extraction Request Id (The study's internal ID)<br>"
        + "SET @StudyRequestId = '#REQUEST_ID#'<br>"
        + "--Data Extraction comment (name of receiver)<br>"
        + "SET @RequestComment = '#REQUEST_COMMENT#'<br><br>"
        + "SELECT DISTINCT<br>"
        + "P.ParticipantID as ParticipantID<br>";
};

var getLIMSSelects = function(variables) {
    var variableList = "";
    var currentAnalysis = "";
    var currentVariable = "";
    var previousAnalysis = "";
    var preQrySpecialCases = ["Joint", "gastro-intestinal", "Cold/influenza", "Other", "Urinary tract"];

    for (var v = 0; v < variables.length; v++) {
        currentVariable = variables[v].variable;
        currentAnalysis = variables[v].analysis 

        if (previousAnalysis === "EPH_PRE_QRY" && (currentAnalysis !== previousAnalysis || v === variables.length-1)) { // Add END to CASE clause
            variableList += "END AS Whatinfection<br>";
        }

        // Handle special cases
        // ---- Pre-query question value mapping ----
        if (currentAnalysis === "EPH_PRE_QRY") {
            if (currentVariable === "What infection") {
                variableList += ",CASE MAX(CASE WHEN Result.ANALYSIS = 'EPH_PRE_QRY' AND Result.REPORTED_NAME = 'What infection' THEN Result.FORMATTED_ENTRY END)<br>"
            } else if (preQrySpecialCases.indexOf(currentVariable) !== -1) {
                variableList += "WHEN '" + getPreQryShortName(currentVariable) + "' THEN '" + currentVariable + "'<br>"
            } else {
                variableList += ",MAX(CASE WHEN Result.ANALYSIS = '" + currentAnalysis
                + "' AND Result.REPORTED_NAME = '" + currentVariable + "' THEN Result.FORMATTED_ENTRY END) AS " + currentVariable.replace(/\s|\-|\//g, "") + "<br>";
            }
        } 
        // ---- End pre-query question value mapping ----
        else if (currentVariable === "Visit-age calculation") {
            variableList += ",(CAST(LEFT(CONVERT(VARCHAR(10), Sample.LOGIN_DATE, 20), 4) AS int) - CAST(LEFT(P.CivicRegistrationNumber, 4) AS int)) AS VisitAge<br>";
        } else if (currentVariable === "Gender") {
            variableList += ",CASE WHEN Substring(P.CivicRegistrationNumber,11,1) % 2 = 0 THEN 'Female' ELSE 'Male' END AS Gender<br>";
        } else if (currentVariable === "Visit date") {
            variableList += ",Sample.LOGIN_DATE AS VisitStartDate<br>";
        } else if (currentVariable === "Visit site") {
            variableList += ",CASE WHEN Sample.LG_MACHINE LIKE '%UU' THEN 'Uppsala' WHEN Sample.LG_MACHINE LIKE '%LU' THEN 'Malmo' END as Site";
        } else {
            variableList += ",MAX(CASE WHEN Result.ANALYSIS = '" + currentAnalysis
                + "' AND Result.REPORTED_NAME = '" + currentVariable + "' THEN Result.FORMATTED_ENTRY END) AS " + currentVariable.replace(/\s|\-|\//g, "") + "<br>";
        }

        previousAnalysis = currentAnalysis;
    }

    return variableList;
};

var getPreQryShortName = function(varName) {
    switch(varName) {
        case "Joint":
            return "LEDER";
        case "gastro-intestinal":
            return "MAGE";
        case "Cold/influenza":
            return "ÖLI";
        case "Other":
            return "ÖVRIGT";
        case "Urinary tract":
            return "UVI";
        default:
            return "-"
    }
};


var getLIMSQueryBottom = function() {
    return "<br>INTO #TempData<br><br>"
        + "--Get study<br>"
        + "FROM LGDB.dbo.Study S<br><br>"
        + "--Get participants in study<br>"
        + "INNER JOIN LGDB.dbo.Participant P<br>"
        + "	ON S.StudyID = P.StudyID<br>"
        + "	AND P.TestParticipant = 0 --Do not include test participants<br>"
        + "	AND P.RecruitmentStatus != 'Testdeltagare'<br><br>"
        + "INNER JOIN LifeGene_MSCRM.dbo.Contact Contact<br>"
        + "	ON P.Guid = Contact.ContactId<br><br>"
        + "INNER JOIN LifeGene_MSCRM.dbo.KI_instudy I<br>"
        + "	ON P.Guid = I.ki_studiepersonid<br><br>"
        + "--Finns minst ett samtycke om deltagaren i aktuell studie så går vi på detta.<br>"
        + "INNER JOIN LifeGene_MSCRM.dbo.ki_consent consent<br>"
        + "	ON P.Guid = consent.ki_regardingcontactid<br>"
        + "	--Om leftby och regarding inte är samma så ska samtycket sluta gälla när regarding fyller 15 år.<br>"
        + "	AND ((CASE WHEN (consent.ki_leftbycontactid != consent.ki_regardingcontactid) THEN LGDB.api.CalculateAge(P.CivicRegistrationNumber) ELSE 18 END) <= 15 OR consent.ki_enddate IS NULL)<br><br>"
        + "--Finns minst ett samtycke om mig där \"Behandla personuppgifter/ Spara enkätsvar/ Spara mätresultat\" är godkänt så används detta<br>"
        + "INNER JOIN LifeGene_MSCRM.dbo.ki_consentlevel cl1<br>"
        + "	ON consent.ki_consentid = cl1.KI_consentId<br>"
        + "	AND cl1.ki_consentlevelcodeid = 'D3A24194-E0A8-DE11-B541-00155D248411' --\"Behandla personuppgifter/ Spara enkätsvar/ Spara mätresultat\"<br>"
        + "	AND cl1.KI_allowfuturedatausage = 1 --Tillåt framtida användning av data<br>"
        + "	AND cl1.KI_value = 1 --\"Behandla personuppgifter/ Spara enkätsvar/ Spara mätresultat\" = Ja<br><br>"
        + "--Finns minst ett samtycke om mig där \"Tillåt hälsorelaterad forskning\" är godkänt så används detta	<br>"
        + "INNER JOIN LifeGene_MSCRM.dbo.ki_consentlevel cl2<br>"
        + "	ON consent.ki_consentid = cl2.KI_consentId<br>"
        + "	AND cl2.ki_consentlevelcodeid = '1A28089F-E0A8-DE11-B541-00155D248411' --\"Tillåt hälsorelaterad forskning\"<br>"
        + "	AND cl2.KI_allowfuturedatausage = 1 --Tillåt framtida användning av data<br>"
        + "	AND cl2.KI_value = 1 --\"Tillåt hälsorelaterad forskning\" = Ja<br><br>"
        + "--Get physical data<br>"
        + "INNER JOIN LGDB.dbo.ExternalParticipant EP<br>"
        + "	ON P.ParticipantID = EP.ParticipantID<br><br>"
        + "INNER JOIN LGDB.dbo.QuestionnaireParticipant QP<br>"
        + "	ON P.ParticipantID = QP.SourceParticipantID<br>"
        + "	and QP.Status = 'completed' -- Completed survey<br><br>"
        + "INNER JOIN [LIMS-PROD].dbo.SAMPLE Sample<br>"
        + "	ON Sample.PATIENT = EP.ExternalParticipantID COLLATE Finnish_Swedish_CI_AS<br>"
        + "	AND EP.ExternalSystemID = 6 --Lims<br>"
        + "	AND Sample.STATUS != 'X'<br><br>"
        + "-- Get visit results<br>"
        + "INNER JOIN [LIMS-PROD].dbo.RESULT Result<br>"
        + "	ON Result.SAMPLE_NUMBER = Sample.SAMPLE_NUMBER<br>"
        + "	AND Result.STATUS != 'X'<br><br>"
        + "WHERE S.Description = @StudyName<br>"
        + "AND Sample.PRODUCT_GRADE NOT LIKE 'Bara blod'<br>"
        + "GROUP BY P.ParticipantID<br>"
        + "		,Sample.LOGIN_DATE<br>"
        + "		,Sample.PRODUCT_GRADE<br>"
        + "		,P.CivicRegistrationNumber<br>"
        + "		,Sample.LG_MACHINE<br>"
        + "		--,Sample.SAMPLE_NUMBER<br><br>"
        + "--Create DataExtraction request<br>"
        + "exec LGDB.DataExtraction.CreateRequest @StudyName, @StudyRequestId, @RequestComment<br><br>"
        + "declare @studyExternalId int = (SELECT ExternalStudyID FROM LGDB.dbo.Study WHERE Description = @StudyName)<br><br>"
        + "--Lookup RequestId in LGDB.DataExtraction.Request<br>"
        + ",@RequestId int = (SELECT RequestId FROM LGDB.DataExtraction.Request WHERE RequestStudyRequestId = @StudyRequestId)<br>"
        + "INSERT INTO LGDB.DataExtraction.Participant (ParticipantId, ParticipantStudyId, RequestId)<br>"
        + "SELECT <br>"
        + "pm.ParticipantID, <br>"
        + "@studyExternalId, <br>"
        + "@RequestId<br>"
        + "FROM #TempData pm<br>"
        + "WHERE NOT EXISTS (<br>"
        + " SELECT 1 FROM LGDB.DataExtraction.Participant <br>"
        + "	WHERE ParticipantId = pm.ParticipantID<br>"
        + "	AND ParticipantStudyId = @studyExternalId<br>"
        + "	AND RequestId = @RequestId)<br><br>"
        + "SELECT<br>"
        + "(SELECT ParticipantDataExtractionId <br>"
        + "	FROM LGDB.DataExtraction.Participant <br>"
        + "	WHERE RequestId = @RequestId <br>"
        + "	AND ParticipantID = PM.ParticipantID) as ParticipantInRequestId --ParticipantDataExtractionId<br>"
        + ",*<br>"
        + "INTO #BaseData<br>"
        + "FROM #TempData PM<br>"
        + "ORDER BY ParticipantInRequestId<br><br>"
        + "--Export output from this query<br>"
        + "SELECT DISTINCT<br>"
        + "B.ParticipantInRequestId,*<br>"
        + "FROM #BaseData B<br>"
        + "ORDER BY B.ParticipantInRequestId<br><br>"
        + "DROP TABLE #TempData<br>"
        + "DROP TABLE #BaseData<br>GO<br>"
};

var getEKGQueryTop = function() {
    return "SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;<br>"
        + "<br>"
        + "DECLARE <br>"
        + " @StudyRequestId nvarchar(20)<br>"
        + ",@RequestComment nvarchar(255)<br>"
        + ",@StudyName nvarchar(20)<br>"
        + ",@RequestId int<br>"
        + "<br>"
        + "SET @StudyRequestId = '#REQUEST_ID#'<br>"
        + "SET @RequestId = (SELECT RequestId FROM LGDB.DataExtraction.Request WHERE RequestStudyRequestId = @StudyRequestId)<br>"
        + "SET @StudyName = 'EpiHealth'<br>"
        + "<br>"
        + "SELECT DISTINCT<br>"
        + " p.ParticipantID as ParticipantID<br>"
        + ",DEP.ParticipantDataExtractionId AS ParticipantInRequestId<br>"
        + ",LGDB.api.CalculateAgeByDate(P.CivicRegistrationNumber,RMZM.TakenTime) as ParticipantAgeAtMeasure<br>"
        + ",LGDB.api.CalculateGender(P.CivicRegistrationNumber) as Gender<br>";

};

var getEKGQuerySelects = function(variables) {
    var variableList = "";
    var currentVariable = "";
    var currentAnalysis = "";

    variableList += ",RMZM.TakenTime as MeasureDate<br>";

    for (var v = 0; v < variables.length; v++) {
        currentVariable = variables[v].variable;
        currentAnalysis = variables[v].analysis 
        variableList += ",RMZM." + currentVariable + " as " + currentVariable.replace(/\s|\-|\//g, "") + "<br>";
    }

    return variableList;
};

var getEKGQueryBottom = function() {
    return "FROM LGDB.dbo.Study S<br>"
        + "<br>"
        + "INNER JOIN LGDB.dbo.Participant P<br>"
        + "		ON S.StudyID = P.StudyID<br>"
        + "		AND P.TestParticipant = 0 --Do not include test participants<br>"
        + "		AND P.RecruitmentStatus != 'Testdeltagare'<br>"
        + "<br>"
        + "INNER JOIN LGDB.DataExtraction.Participant DEP<br>"
        + "	ON P.ParticipantID = DEP.ParticipantId<br>"
        + "<br>"
        + "INNER JOIN ResultManager.Zenicor.Measurement RMZM ON P.ParticipantID = RMZM.PatientId<br>"
        + "<br>"
        + "INNER JOIN ResultManager.Zenicor.Diagnosis RMZD ON RMZM.DiagnosisId = RMZD.DiagnosisId<br>"
        + "<br>"
        + "WHERE S.Description = @StudyName<br>"
        + "AND DEP.RequestId = @RequestId<br>"
        + "order by ParticipantInRequestId<br>";
};

var getBloodQueryTop = function() {
    return "SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;<br>"
        + "<br>"
        + "DECLARE <br>"
        + " @StudyRequestId nvarchar(20)<br>"
        + ",@RequestComment nvarchar(255)<br>"
        + ",@StudyName nvarchar(20)<br>"
        + ",@RequestId int<br>"
        + "<br>"
        + "SET @StudyRequestId = '#REQUEST_ID#'<br>"
        + "SET @RequestId = (SELECT RequestId FROM LGDB.DataExtraction.Request WHERE RequestStudyRequestId = @StudyRequestId)<br>"
        + "SET @StudyName = 'EpiHealth'<br>"
        + "<br>"
        + "SELECT DISTINCT<br>"
        + " p.ParticipantID as ParticipantID<br>"
        + ",DEP.ParticipantDataExtractionId AS ParticipantInRequestId<br>"
        + ", RMKR.InvestigationName<br>"
        + ", RMKR.ResultValue<br>"
        + ", RMKR.ResultUnit<br>"
        + ", RMKR.SourceSystemDescription<br>";
};

var getBloodQueryFilters = function(variables) {
    console.log("add filters")
    var variableList = "";
    var currentVariable = "";
    var currentAnalysis = "";
    var investigationNameMapping = {};
    investigationNameMapping["NaFl (analysis)"] = ""; // oklart om denna ens finns
    investigationNameMapping["P-Glucose"] = "P-Glukos";
    investigationNameMapping["LiHep (analysis)"] = ""; // oklart om denna ens finns
    investigationNameMapping["P-total cholesterol"] = ""; // oklart om denna ens finns
    investigationNameMapping["P-HDL-cholesterol"] = "P-HDL-kolesterol";
    investigationNameMapping["fP-Triglycerides"] = "fP-Triglycerider";
    investigationNameMapping["P-Triglycerides"] = "P-Triglycerider";
    investigationNameMapping["LDL-cholesterol, calculated"] = "LDL-kolesterol, calculated";

    variableList += "AND InvestigationName IN (";

    for (var v = 0; v < variables.length; v++) {
        currentVariable = variables[v].variable;
        currentAnalysis = variables[v].analysis;
        
        if (currentVariable.substring(0,2) === "fP") {
            // Special case for investigation "fP-Triglycerides/P-Triglycerides"
            variableList += "'" + investigationNameMapping[currentVariable.split("/")[0]] + "',";
            variableList += "'" + investigationNameMapping[currentVariable.split("/")[1]] + "'";
        } else {
            variableList += "'" + investigationNameMapping[currentVariable] + "'"
        }
        
        if (v !== variables.length-1)
            variableList += ','
    }

    variableList += ")";

    return variableList;
};

var getBloodQueryBottom = function() {
    return "FROM LGDB.dbo.Study S<br>"
        + "<br>"
        + "--Get participants in study<br>"
        + "INNER JOIN LGDB.dbo.Participant P<br>"
        + "		ON S.StudyID = P.StudyID<br>"
        + "		AND P.TestParticipant = 0 --Do not include test participants<br>"
        + "		AND P.RecruitmentStatus != 'Testdeltagare'<br>"
        + "<br>"
        + "INNER JOIN LGDB.dbo.ExternalParticipant EP<br>"
        + "	ON P.ParticipantID = EP.ParticipantID<br>"
        + "<br>"
        + "INNER JOIN LGDB.DataExtraction.Participant DEP<br>"
        + "	ON P.ParticipantID = DEP.ParticipantId<br>"
        + "	<br>"
        + "INNER JOIN [LIMS-PROD].dbo.SAMPLE Sample<br>"
        + "	ON Sample.PATIENT = EP.ExternalParticipantID COLLATE Finnish_Swedish_CI_AS<br>"
        + "	AND EP.ExternalSystemID = 6 --Lims<br>"
        + "	AND Sample.STATUS != 'X'<br>"
        + "<br>"
        + "INNER JOIN [ResultManager].[UL].[KemlabResultCurrent] RMKR<br>"
        + "	ON Sample.TEXT_ID = RMKR.SampleBarcode COLLATE Finnish_Swedish_CI_AS<br>"
        + "WHERE S.Description = @StudyName<br>"
        + "AND DEP.RequestId = @RequestId<br>"
        + "#BLOOD_ANALYSIS_FILTERS#<br>"
        + "order by ParticipantInRequestId";
};

var addBloodAnalysisFilters = function(queryString, variables) {
    return queryString.replace("#BLOOD_ANALYSIS_FILTERS#", getBloodQueryFilters(variables));
};

// This won't work in Chrome due to disabled cross-origin request
var readTextFile = function(file) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
        if(rawFile.readyState === 4) {
            if(rawFile.status === 200 || rawFile.status == 0) {
                var allText = rawFile.responseText;
                alert(allText);
            }
        }
    }
    rawFile.send(null);
};

