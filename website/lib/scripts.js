/**
 * NOTE: all functions called getXXXQuery... are to be considered temporary as these only return text strings that build up the
 * SQL queries for the data requests. They are full of special case handling and overall these string resources should be fetched
 * from a backend service instead. Also, the order document/main website page should be looked at and probably adjusted a bit in
 * order to avoid some of the special case handling.
 */

$(function () {

    $('#physicalDataForm').on('submit', function (e) {
        if (!e.isDefaultPrevented()) {
            generatePhysicalQuery(["EPH_PHYS_LIMS", "EPH_PHYS_EKG", "EPH_PHYS_BLOOD"]);
            document.getElementById("physicalOutput").scrollIntoView();
            return false;
        }
    })

    $('#surveyDataForm').on('submit', function (e) {
        if (!e.isDefaultPrevented()) {
            generateSurveyQuery(["EPH_SURVEY_SOC", "EPH_SURVEY_SELFCARE", "EPH_SURVEY_LIFESTYLE", "EPH_SURVEY_WOMHEALTH", "EPH_SURVEY_LIVINGHAB", "EPH_SURVEY_HEALTHHIST"
                , "EPH_SURVEY_INJURIES", "EPH_SURVEY_ASTHMAALRG", "EPH_SURVEY_MENTALHEALTH"]);
            document.getElementById("surveyOutput").scrollIntoView();
            return false;
        }
    })    
});

var generatePhysicalQuery = function(targetList) {

    var selectedVariables;
    var query = "";
    var currentTarget;

    for (var t in targetList) {
        currentTarget = targetList[t];
        selectedVariables = getSelectedVariables(currentTarget);

        if (selectedVariables.length > 0) {
            switch (currentTarget) {
                case "EPH_PHYS_LIMS":
                    query += "-- ======== LIMS Query ========<br><br>" + addRequestIdAndComment(getLIMSQueryTop() + getLIMSSelects(selectedVariables) + getLIMSQueryBottom())
                    break;

                case "EPH_PHYS_EKG":
                    query += "<br>-- ======== EKG Query ========<br><br>" + addRequestIdAndComment(getEKGQueryTop() + getEKGQuerySelects(selectedVariables) + getEKGQueryBottom())
                    break;

                case "EPH_PHYS_BLOOD":
                    query += "<br>-- ======== Blood analysis Query ========<br><br>" + addBloodAnalysisFilters(getBloodQueryTop() + getBloodQueryBottom(), selectedVariables);
                    break;

                default:
                    break;
            }
        }
    }
     
    displayOutput(query, "physicalOutput");
};

var generateSurveyQuery = function(targetList) {
    var selectedVariables = "";
    var query = "";
    var currentTarget = "";

    for (var t in targetList) {
        currentTarget = targetList[t];
        selectedVariables = getSelectedVariables(currentTarget);

        if (selectedVariables.length > 0) {
            switch (currentTarget) {
                case "EPH_SURVEY_SOC":
                    query += "-- Sociodemography<br><br>" +  getSurveyQuerySelects(selectedVariables);
                    break;

                case "EPH_SURVEY_SELFCARE":
                    query += "<br>-- Self-care<br><br>" + getSurveyQuerySelects(selectedVariables);
                    break;

                case "EPH_SURVEY_LIFESTYLE":
                    query += "<br>-- Lifestyle<br><br>" + getSurveyQuerySelects(selectedVariables);
                    break;

                case "EPH_SURVEY_WOMHEALTH":
                    query += "<br>-- Woman's health<br><br>" + getSurveyQuerySelects(selectedVariables);
                    break;

                case "EPH_SURVEY_LIVINGHAB":
                    query += "<br>-- Living habits<br><br>" + getSurveyQuerySelects(selectedVariables);
                    break;

                case "EPH_SURVEY_HEALTHHIST":
                    query += "<br>-- Health history<br><br>" + getSurveyQuerySelects(selectedVariables);
                    break;

                case "EPH_SURVEY_INJURIES":
                    query += "<br>-- Injuries<br><br>" + getSurveyQuerySelects(selectedVariables);
                    break;

                case "EPH_SURVEY_ASTHMAALRG":
                    query += "<br>-- Asthma and allergy<br><br>" + getSurveyQuerySelects(selectedVariables);
                    break;

                case "EPH_SURVEY_MENTALHEALTH":
                    query += "<br>-- Mental health<br><br>" + getSurveyQuerySelects(selectedVariables);
                    break;

                default:
                    break;
            }
        }
    }

    query = addRequestIdAndComment(getSurveyQueryTop() + query + getSurveyQueryBottom());

    displayOutput(query, "surveyOutput");
};

var getSelectedVariables = function(target) {
    var checkboxes = document.getElementsByName(target);
    var variables = [];

    for (var i = 0; i < checkboxes.length; i++) {
        var checkbox = checkboxes[i];

        if (checkbox.checked) {
            var currentRow = checkbox.parentNode.parentNode;
  
            
            if (currentRow.getElementsByTagName("td").length < 8) {
                console.log(currentRow.getElementsByTagName("td")[2])
                continue;
            }
            

            var variableNameColumn = currentRow.getElementsByTagName("td")[2];
            var analysisNameColumn = currentRow.getElementsByTagName("td")[7];

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
    return queryString.replace("#REQUEST_ID#", $('#dataRequestIdPhysical').val()).replace("#REQUEST_COMMENT#", $('#dataRequestCommentPhysical').val())
};

var displayOutput = function(content, target) {
    var outputArea = $('#' + target);
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

var getSurveyQueryTop = function() {
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
        + ",DEP.ParticipantDataExtractionId AS ParticipantInRequestId<br><br>";
};

var getSurveyQuerySelects = function(variableList) {
    var surveyLookup = getSurveyLookup();
    var queryRows = "";
    var lookup = "";

    for (var index in variableList) {
        lookup = surveyLookup[variableList[index].variable];
        
        if (lookup !== undefined) {
            queryRows += "," + lookup + "<br>";
            surveyLookup[variableList[index].variable] = undefined; // to avoid duplicate rows in query, some variable occur more than once in the order form (for verbosity)
        }
    }

    return queryRows;
};

var getSurveyQueryBottom = function() {
    return "<br>FROM LGDB.DataExtraction.Participant DEP<br>"
        + "<br>"
        + "--Get Confirmit Id for participant	<br>"
        + "INNER JOIN LGDB.dbo.ExternalParticipant ConfirmitId<br>"
        + "	ON DEP.ParticipantID = ConfirmitId.ParticipantID<br>"
        + "	AND ConfirmitId.ExternalSystemID = 5<br>"
        + "<br>"
        + "--Get EpiHealth survey tables<br>"
        + "INNER JOIN survey_p0642585.dbo.respondent R<br>"
        + "	ON ConfirmitId.ExternalParticipantID = R.userid<br>"
        + "	AND ConfirmitId.ExternalSystemID = 5<br>"
        + "<br>"
        + "LEFT JOIN survey_p0642585.dbo.response0 r0<br>"
        + "	ON r.respid = r0.respid<br>"
        + "<br>"
        + "LEFT JOIN survey_p0642585.dbo.response1 r1<br>"
        + "	ON r.respid = r1.respid<br>"
        + "<br>"
        + "LEFT JOIN survey_p0642585.dbo.response2 r2<br>"
        + "	ON r.respid = r2.respid<br>"
        + "<br>"
        + "LEFT JOIN survey_p0642585.dbo.response3 r3<br>"
        + "	ON r.respid = r3.respid<br>"
        + "<br>"
        + "LEFT JOIN survey_p0642585.dbo.response4 r4<br>"
        + "	ON r.respid = r4.respid<br>"
        + "<br>"
        + "LEFT JOIN survey_p0642585.dbo.response5 r5<br>"
        + "	ON r.respid = r5.respid<br>"
        + "<br>"
        + "WHERE DEP.RequestId = @RequestId<br>"
        + "<br>"
        + "ORDER BY DEP.ParticipantDataExtractionId<br>";
};

var getSurveyLookup = function() {
    var surveyLookup = {};
    surveyLookup['soc_civilstatus']='r1.soc_civilstatus';
    surveyLookup['soc_education']='r1.soc_education';
    surveyLookup['soc_dwelling']='r1.soc_dwelling';
    surveyLookup['soc_dwelling_build']='r1.soc_dwelling_build';
    surveyLookup['soc_dwelling_reno']='r1.soc_dwelling_reno';
    surveyLookup['soc_dwelling_reno_whc_wal']='r1.soc_dwelling_reno_whc_wal';
    surveyLookup['soc_dwelling_reno_whc_pai']='r1.soc_dwelling_reno_whc_pai';
    surveyLookup['soc_dwelling_reno_whc_pap']='r1.soc_dwelling_reno_whc_pap';
    surveyLookup['soc_dwelling_reno_whc_flo']='r1.soc_dwelling_reno_whc_flo';
    surveyLookup['soc_dwelling_reno_whc_oth']='r1.soc_dwelling_reno_whc_oth';
    surveyLookup['soc_dwelling_reno_whc_998']='r1.soc_dwelling_reno_whc_998';
    surveyLookup['soc_dwelling_reno_whc_floo_lin']='r1.soc_dwelling_reno_whc_floo_lin';
    surveyLookup['soc_dwelling_reno_whc_floo_pcv']='r1.soc_dwelling_reno_whc_floo_pcv';
    surveyLookup['soc_dwelling_reno_whc_floo_lam']='r1.soc_dwelling_reno_whc_floo_lam';
    surveyLookup['soc_dwelling_reno_whc_floo_car']='r1.soc_dwelling_reno_whc_floo_car';
    surveyLookup['soc_dwelling_reno_whc_floo_cor']='r1.soc_dwelling_reno_whc_floo_cor';
    surveyLookup['soc_dwelling_reno_whc_floo_oth']='r1.soc_dwelling_reno_whc_floo_oth';
    surveyLookup['soc_dwelling_reno_whc_floo_998']='r1.soc_dwelling_reno_whc_floo_998';
    surveyLookup['soc_dwelling_rado']='r1.soc_dwelling_rado';
    surveyLookup['soc_watersupply']='r1.soc_watersupply';
    surveyLookup['soc_wrk5year_dur_5yrs']='r1.soc_wrk5year_dur_5yrs';
    surveyLookup['soc_wrk5year_int_5yrs']='r1.soc_wrk5year_int_5yrs';
    surveyLookup['soc_wrk5year_occ_5yrs']='r1.soc_wrk5year_occ_5yrs';
    surveyLookup['soc_wrk5year_plc_5yrs']='r1.soc_wrk5year_plc_5yrs';
    surveyLookup['soc_presentsit']='r1.soc_presentsit';
    surveyLookup['soc_wrkhours']='r1.soc_wrkhours';
    surveyLookup['soc_wrkovertime_5hr']='r1.soc_wrkovertime_5hr';
    surveyLookup['soc_shiftwork']='r1.soc_shiftwork';
    surveyLookup['soc_shiftwork_dur']='r1.soc_shiftwork_dur';
    surveyLookup['soc_wrknight_dur']='r1.soc_wrknight_dur';
    surveyLookup['soc_wrkbreath']='r1.soc_wrkbreath';
    surveyLookup['soc_wrkbreath_leavejob']='r1.soc_wrkbreath_leavejob';
    surveyLookup['soc_wrkbreath_leavejob_whc']='r1.soc_wrkbreath_leavejob_whc';
    surveyLookup['soc_wrkgasdust']='r1.soc_wrkgasdust';
    surveyLookup['soc_wrkgasdust_whc']='r1.soc_wrkgasdust_whc';
    surveyLookup['soc_wrkdust']='r1.soc_wrkdust';
    surveyLookup['soc_wrkdust_yrs_other']='r1.soc_wrkdust_yrs_other';
    surveyLookup['soc_wrkenvir_sens_dus']='r1.soc_wrkenvir_sens_dus';
    surveyLookup['soc_wrkenvir_sens_lou']='r1.soc_wrkenvir_sens_lou';
    surveyLookup['soc_wrknoise_loud']='r1.soc_wrknoise_loud';
    surveyLookup['soc_wrknoise']='r1.soc_wrknoise';
    surveyLookup['soc_wrknoise_raisev']='r1.soc_wrknoise_raisev';
    surveyLookup['soc_wrknoise_shout']='r1.soc_wrknoise_shout';
    surveyLookup['soc_wrknoise_protection']='r1.soc_wrknoise_protection';
    surveyLookup['soc_wrkenvir_exp_out']='r1.soc_wrkenvir_exp_out';
    surveyLookup['soc_wrkenvir_exp_cou']='r1.soc_wrkenvir_exp_cou';
    surveyLookup['soc_wrkenvir_exp_wat']='r1.soc_wrkenvir_exp_wat';
    surveyLookup['soc_wrkenvir_exp_det']='r1.soc_wrkenvir_exp_det';
    surveyLookup['soc_wrkenvir_exp_des']='r1.soc_wrkenvir_exp_des';
    surveyLookup['soc_wrkenvir_exp_cos']='r1.soc_wrkenvir_exp_cos';
    surveyLookup['soc_wrkenvir_exp_hai']='r1.soc_wrkenvir_exp_hai';
    surveyLookup['soc_wrkenvir_exp_spr']='r1.soc_wrkenvir_exp_spr';
    surveyLookup['soc_wrkenvir_exp_pai']='r1.soc_wrkenvir_exp_pai';
    surveyLookup['soc_wrkenvir_exp_sol']='r1.soc_wrkenvir_exp_sol';
    surveyLookup['soc_wrkenvir_exp_deg']='r1.soc_wrkenvir_exp_deg';
    surveyLookup['soc_wrkenvir_exp_die']='r1.soc_wrkenvir_exp_die';
    surveyLookup['soc_wrkenvir_exp_wel']='r1.soc_wrkenvir_exp_wel';
    surveyLookup['soc_wrkenvir_exp_met']='r1.soc_wrkenvir_exp_met';
    surveyLookup['soc_wrkenvir_exp_pes']='r1.soc_wrkenvir_exp_pes';
    surveyLookup['soc_wrkenvir_exp_ext']='r1.soc_wrkenvir_exp_ext';
    surveyLookup['soc_wrkenvir_exp_gar']='r1.soc_wrkenvir_exp_gar';
    surveyLookup['soc_wrkenvir_exp_noi']='r1.soc_wrkenvir_exp_noi';
    surveyLookup['soc_wrkenvir_exp_vib']='r1.soc_wrkenvir_exp_vib';
    surveyLookup['soc_wrkenvir_exp_mou']='r1.soc_wrkenvir_exp_mou';
    surveyLookup['soc_wrkenvir_exp_996']='r1.soc_wrkenvir_exp_996';
    surveyLookup['soc_wrkenvir_exp_998']='r1.soc_wrkenvir_exp_998';
    surveyLookup['soc_wrkenvir_expe_out']='r1.soc_wrkenvir_expe_out';
    surveyLookup['soc_wrkenvir_expe_cou']='r1.soc_wrkenvir_expe_cou';
    surveyLookup['soc_wrkenvir_expe_wat']='r1.soc_wrkenvir_expe_wat';
    surveyLookup['soc_wrkenvir_expe_det']='r1.soc_wrkenvir_expe_det';
    surveyLookup['soc_wrkenvir_expe_des']='r1.soc_wrkenvir_expe_des';
    surveyLookup['soc_wrkenvir_expe_cos']='r1.soc_wrkenvir_expe_cos';
    surveyLookup['soc_wrkenvir_expe_hai']='r1.soc_wrkenvir_expe_hai';
    surveyLookup['soc_wrkenvir_expe_spr']='r1.soc_wrkenvir_expe_spr';
    surveyLookup['soc_wrkenvir_expe_pai']='r1.soc_wrkenvir_expe_pai';
    surveyLookup['soc_wrkenvir_expe_sol']='r1.soc_wrkenvir_expe_sol';
    surveyLookup['soc_wrkenvir_expe_deg']='r1.soc_wrkenvir_expe_deg';
    surveyLookup['soc_wrkenvir_expe_die']='r1.soc_wrkenvir_expe_die';
    surveyLookup['soc_wrkenvir_expe_wel']='r1.soc_wrkenvir_expe_wel';
    surveyLookup['soc_wrkenvir_expe_met']='r1.soc_wrkenvir_expe_met';
    surveyLookup['soc_wrkenvir_expe_pes']='r1.soc_wrkenvir_expe_pes';
    surveyLookup['soc_wrkenvir_expe_ext']='r1.soc_wrkenvir_expe_ext';
    surveyLookup['soc_wrkenvir_expe_gar']='r1.soc_wrkenvir_expe_gar';
    surveyLookup['soc_wrkenvir_expe_noi']='r1.soc_wrkenvir_expe_noi';
    surveyLookup['soc_wrkenvir_expe_vib']='r1.soc_wrkenvir_expe_vib';
    surveyLookup['soc_wrkenvir_expe_mou']='r1.soc_wrkenvir_expe_mou';
    surveyLookup['soc_wrkexper2x_bul']='r1.soc_wrkexper2x_bul';
    surveyLookup['soc_wrkexper2x_dis']='r1.soc_wrkexper2x_dis';
    surveyLookup['soc_wrkexper2x_har']='r1.soc_wrkexper2x_har';
    surveyLookup['soc_wrkexper2x_thr']='r1.soc_wrkexper2x_thr';
    surveyLookup['soc_wrkexper2x_no']='r1.soc_wrkexper2x_no';
    surveyLookup['soc_wrkexper2x_998']='r2.soc_wrkexper2x_998';
    surveyLookup['soc_12mntsexper_une']='r2.soc_12mntsexper_une';
    surveyLookup['soc_12mntsexper_wor']='r2.soc_12mntsexper_wor';
    surveyLookup['soc_12mntsexper_reo']='r2.soc_12mntsexper_reo';
    surveyLookup['soc_12mntsexper_not']='r2.soc_12mntsexper_not';
    surveyLookup['soc_12mntsexper_none']='r2.soc_12mntsexper_none';
    surveyLookup['soc_12mntsexper_998']='r2.soc_12mntsexper_998';
    surveyLookup['soc_wrkcondition_fast']='r2.soc_wrkcondition_fast';
    surveyLookup['soc_wrkcondition_hard']='r2.soc_wrkcondition_hard';
    surveyLookup['soc_wrkcondition_effo']='r2.soc_wrkcondition_effo';
    surveyLookup['soc_wrkcondition_time']='r2.soc_wrkcondition_time';
    surveyLookup['soc_wrkcondition_cont']='r2.soc_wrkcondition_cont';
    surveyLookup['soc_wrkcondition_lear']='r2.soc_wrkcondition_lear';
    surveyLookup['soc_wrkcondition_skil']='r2.soc_wrkcondition_skil';
    surveyLookup['soc_wrkcondition_inge']='r2.soc_wrkcondition_inge';
    surveyLookup['soc_wrkcondition_repe']='r2.soc_wrkcondition_repe';
    surveyLookup['soc_wrkcondition_deci']='r2.soc_wrkcondition_deci';
    surveyLookup['soc_wrkcondition_free']='r2.soc_wrkcondition_free';
    surveyLookup['soc_wrkcondition_resp']='r2.soc_wrkcondition_resp';
    surveyLookup['soc_wrkmood_calm']='r2.soc_wrkmood_calm';
    surveyLookup['soc_wrkmood_cohe']='r2.soc_wrkmood_cohe';
    surveyLookup['soc_wrkmood_stan']='r2.soc_wrkmood_stan';
    surveyLookup['soc_wrkmood_unde']='r2.soc_wrkmood_unde';
    surveyLookup['soc_wrkmood_supe']='r2.soc_wrkmood_supe';
    surveyLookup['soc_wrkmood_subo']='r2.soc_wrkmood_subo';
    surveyLookup['soc_wrkmood_coll']='r2.soc_wrkmood_coll';
    surveyLookup['soc_chngjobs_1']='r2.soc_chngjobs_1';
    surveyLookup['qua_eq5_1']='r2.qua_eq5_1';
    surveyLookup['qua_eq5_2']='r2.qua_eq5_2';
    surveyLookup['qua_eq5_3']='r2.qua_eq5_3';
    surveyLookup['qua_eq5_4']='r2.qua_eq5_4';
    surveyLookup['qua_eq5_5']='r2.qua_eq5_5';
    surveyLookup['qua_eq5_vas_hea']='r2.qua_eq5_vas_hea';
    surveyLookup['qua2_satisfied_1']='r2.qua2_satisfied_1';
    surveyLookup['qua2_gotimport_1']='r2.qua2_gotimport_1';
    surveyLookup['qua2_nochange_1']='r2.qua2_nochange_1';
    surveyLookup['qua2_happy_1']='r2.qua2_happy_1';
    surveyLookup['qua2_peers_1']='r2.qua2_peers_1';
    surveyLookup['qua2_regardless_1']='r2.qua2_regardless_1';
    surveyLookup['qua_socialactive_1']='r2.qua_socialactive_1';
    surveyLookup['qua2_overall_1']='r2.qua2_overall_1';
    surveyLookup['qua_stress_1']='r2.qua_stress_1';
    surveyLookup['qua_stress_2']='r2.qua_stress_2';
    surveyLookup['qua_stress_3']='r2.qua_stress_3';
    surveyLookup['qua_stress_4']='r2.qua_stress_4';
    surveyLookup['qua_stress_5']='r2.qua_stress_5';
    surveyLookup['qua_stress_6']='r2.qua_stress_6';
    surveyLookup['qua_stress_7']='r2.qua_stress_7';
    surveyLookup['qua_stress_8']='r2.qua_stress_8';
    surveyLookup['qua_stress_9']='r2.qua_stress_9';
    surveyLookup['qua_stress_10']='r2.qua_stress_10';
    surveyLookup['qua_dailyactivities']='r2.qua_dailyactivities';
    surveyLookup['qua_mobility_outdoor_1']='r2.qua_mobility_outdoor_1';
    surveyLookup['qua_mobility_outdoor_2']='r2.qua_mobility_outdoor_2';
    surveyLookup['qua_mobility_outdoor_3']='r2.qua_mobility_outdoor_3';
    surveyLookup['qua_mobility_outdoor_4']='r2.qua_mobility_outdoor_4';
    surveyLookup['qua_mobility_outdoor_998']='r2.qua_mobility_outdoor_998';
    surveyLookup['qua_ownshopping']='r2.qua_ownshopping';
    surveyLookup['qua_mobility_stairs']='r2.qua_mobility_stairs';
    surveyLookup['qua_mobility_stairs_2_other']='r2.qua_mobility_stairs_2_other';
    surveyLookup['qua_mobility_indoor_1']='r2.qua_mobility_indoor_1';
    surveyLookup['qua_mobility_indoor_2']='r2.qua_mobility_indoor_2';
    surveyLookup['qua_mobility_indoor_2_other']='r2.qua_mobility_indoor_2_other';
    surveyLookup['qua_mobility_indoor_3']='r2.qua_mobility_indoor_3';
    surveyLookup['qua_mobility_indoor_4']='r2.qua_mobility_indoor_4';
    surveyLookup['qua_mobility_indoor_998']='r2.qua_mobility_indoor_998';
    surveyLookup['qua_houseworksimple']='r2.qua_houseworksimple';
    surveyLookup['qua_houseworkheavy']='r2.qua_houseworkheavy';
    surveyLookup['qua_cooking']='r2.qua_cooking';
    surveyLookup['qua_mobility_bed']='r2.qua_mobility_bed';
    surveyLookup['qua_selfcare']='r2.qua_selfcare';
    surveyLookup['qua_dowashing']='r2.qua_dowashing';
    surveyLookup['qua_shower']='r2.qua_shower';
    surveyLookup['qua_dressing']='r2.qua_dressing';
    surveyLookup['qua_eating']='r2.qua_eating';
    surveyLookup['die2_meals_frq_brea']='r2.die2_meals_frq_brea';
    surveyLookup['die2_meals_frq_lunc']='r2.die2_meals_frq_lunc';
    surveyLookup['die2_meals_frq_dinn']='r2.die2_meals_frq_dinn';
    surveyLookup['die_meals_coff_frq']='r2.die_meals_coff_frq';
    surveyLookup['die2_beverage_day_wate']='r2.die2_beverage_day_wate';
    surveyLookup['die2_beverage_day_coff']='r2.die2_beverage_day_coff';
    surveyLookup['die2_beverage_day_tea']='r2.die2_beverage_day_tea';
    surveyLookup['die2_beverage_day_milk']='r2.die2_beverage_day_milk';
    surveyLookup['die2_beverage_day_juic']='r2.die2_beverage_day_juic';
    surveyLookup['die2_beverage_day_soda']='r2.die2_beverage_day_soda';
    surveyLookup['die2_beverage_week_wate']='r2.die2_beverage_week_wate';
    surveyLookup['die2_beverage_week_coff']='r2.die2_beverage_week_coff';
    surveyLookup['die2_beverage_week_tea']='r2.die2_beverage_week_tea';
    surveyLookup['die2_beverage_week_milk']='r2.die2_beverage_week_milk';
    surveyLookup['die2_beverage_week_juic']='r2.die2_beverage_week_juic';
    surveyLookup['die2_beverage_week_soda']='r2.die2_beverage_week_soda';
    surveyLookup['die_beverage_coff_acc_milk']='r2.die_beverage_coff_acc_milk';
    surveyLookup['die_beverage_coff_acc_suga']='r2.die_beverage_coff_acc_suga';
    surveyLookup['die_beverage_coff_acc_swee']='r2.die_beverage_coff_acc_swee';
    surveyLookup['die_beverage_coff_acc_996']='r2.die_beverage_coff_acc_996';
    surveyLookup['die_beverage_coff_acc_998']='r2.die_beverage_coff_acc_998';
    surveyLookup['die_beverage_tea_kind_blac']='r2.die_beverage_tea_kind_blac';
    surveyLookup['die_beverage_tea_kind_gree']='r2.die_beverage_tea_kind_gree';
    surveyLookup['die_beverage_tea_kind_red']='r2.die_beverage_tea_kind_red';
    surveyLookup['die_beverage_tea_kind_herb']='r2.die_beverage_tea_kind_herb';
    surveyLookup['die_beverage_tea_kind_oth']='r2.die_beverage_tea_kind_oth';
    surveyLookup['die_beverage_tea_kind_998']='r2.die_beverage_tea_kind_998';
    surveyLookup['die_beverage_tea_acc_milk']='r2.die_beverage_tea_acc_milk';
    surveyLookup['die_beverage_tea_acc_suga']='r2.die_beverage_tea_acc_suga';
    surveyLookup['die_beverage_tea_acc_swee']='r2.die_beverage_tea_acc_swee';
    surveyLookup['die_beverage_tea_acc_996']='r2.die_beverage_tea_acc_996';
    surveyLookup['die_beverage_tea_acc_998']='r2.die_beverage_tea_acc_998';
    surveyLookup['die2_food1a_day_brew']='r2.die2_food1a_day_brew';
    surveyLookup['die2_food1a_day_bred']='r2.die2_food1a_day_bred';
    surveyLookup['die2_food1a_day_brer']='r2.die2_food1a_day_brer';
    surveyLookup['die2_food1a_day_yogh']='r2.die2_food1a_day_yogh';
    surveyLookup['die2_food1a_day_musl']='r2.die2_food1a_day_musl';
    surveyLookup['die2_food1a_day_oat']='r2.die2_food1a_day_oat';
    surveyLookup['die2_food1a_week_brew']='r2.die2_food1a_week_brew';
    surveyLookup['die2_food1a_week_bred']='r2.die2_food1a_week_bred';
    surveyLookup['die2_food1a_week_brer']='r2.die2_food1a_week_brer';
    surveyLookup['die2_food1a_week_yogh']='r2.die2_food1a_week_yogh';
    surveyLookup['die2_food1a_week_musl']='r2.die2_food1a_week_musl';
    surveyLookup['die2_food1a_week_oat']='r2.die2_food1a_week_oat';
    surveyLookup['die2_food1a_bread_amount']='r2.die2_food1a_bread_amount';
    surveyLookup['die2_food1a_bread_spre_kind_breg']='r2.die2_food1a_bread_spre_kind_breg';
    surveyLookup['die2_food1a_bread_spre_kind_marl']='r2.die2_food1a_bread_spre_kind_marl';
    surveyLookup['die2_food1a_bread_spre_kind_cole']='r2.die2_food1a_bread_spre_kind_cole';
    surveyLookup['die2_food1a_bread_spre_kind_butt']='r2.die2_food1a_bread_spre_kind_butt';
    surveyLookup['die2_food1a_bread_spre_kind_oth']='r2.die2_food1a_bread_spre_kind_oth';
    surveyLookup['die2_food1a_bread_spre_kind_no']='r2.die2_food1a_bread_spre_kind_no';
    surveyLookup['die2_food1a_bread_spre_kind_998']='r2.die2_food1a_bread_spre_kind_998';
    surveyLookup['die2_food1a_yoghurt_bact']='r2.die2_food1a_yoghurt_bact';
    surveyLookup['die2_food1a_yoghurt_natu']='r2.die2_food1a_yoghurt_natu';
    surveyLookup['die2_food1a_yoghurt_frui']='r2.die2_food1a_yoghurt_frui';
    surveyLookup['die2_food1a_yoghurt_oth']='r2.die2_food1a_yoghurt_oth';
    surveyLookup['die2_food1a_yoghurt_998']='r2.die2_food1a_yoghurt_998';
    surveyLookup['die2_food1a_musli_oth']='r2.die2_food1a_musli_oth';
    surveyLookup['die2_food1a_musli_998']='r2.die2_food1a_musli_998';
    surveyLookup['die2_food1b_day_che']='r2.die2_food1b_day_che';
    surveyLookup['die2_food1b_day_meat']='r2.die2_food1b_day_meat';
    surveyLookup['die2_food1b_day_egg']='r2.die2_food1b_day_egg';
    surveyLookup['die2_food1b_day_lins']='r2.die2_food1b_day_lins';
    surveyLookup['die2_food1b_week_che']='r2.die2_food1b_week_che';
    surveyLookup['die2_food1b_week_meat']='r2.die2_food1b_week_meat';
    surveyLookup['die2_food1b_week_egg']='r2.die2_food1b_week_egg';
    surveyLookup['die2_food1b_week_lins']='r2.die2_food1b_week_lins';
    surveyLookup['die2_food1b_cheeze']='r2.die2_food1b_cheeze';
    surveyLookup['die2_food2_week_bana']='r2.die2_food2_week_bana';
    surveyLookup['die2_food2_week_appl']='r2.die2_food2_week_appl';
    surveyLookup['die2_food2_week_oran']='r2.die2_food2_week_oran';
    surveyLookup['die2_food2_mnt_bana']='r2.die2_food2_mnt_bana';
    surveyLookup['die2_food2_mnt_appl']='r2.die2_food2_mnt_appl';
    surveyLookup['die2_food2_mnt_oran']='r2.die2_food2_mnt_oran';
    surveyLookup['die2_food3_week_bisc']='r2.die2_food3_week_bisc';
    surveyLookup['die2_food3_week_muff']='r2.die2_food3_week_muff';
    surveyLookup['die2_food3_week_choc']='r2.die2_food3_week_choc';
    surveyLookup['die2_food3_week_cand']='r2.die2_food3_week_cand';
    surveyLookup['die2_food3_week_icec']='r2.die2_food3_week_icec';
    surveyLookup['die2_food3_week_nuts']='r2.die2_food3_week_nuts';
    surveyLookup['die2_food3_week_chip']='r2.die2_food3_week_chip';
    surveyLookup['die2_food3_mnt_bisc']='r2.die2_food3_mnt_bisc';
    surveyLookup['die2_food3_mnt_muff']='r2.die2_food3_mnt_muff';
    surveyLookup['die2_food3_mnt_choc']='r2.die2_food3_mnt_choc';
    surveyLookup['die2_food3_mnt_cand']='r2.die2_food3_mnt_cand';
    surveyLookup['die2_food3_mnt_icec']='r2.die2_food3_mnt_icec';
    surveyLookup['die2_food3_mnt_nuts']='r2.die2_food3_mnt_nuts';
    surveyLookup['die2_food3_mnt_chip']='r2.die2_food3_mnt_chip';
    surveyLookup['die2_food3_choc_amount']='r2.die2_food3_choc_amount';
    surveyLookup['die2_food3_choc_kind_crea']='r2.die2_food3_choc_kind_crea';
    surveyLookup['die2_food3_choc_kind_milk']='r2.die2_food3_choc_kind_milk';
    surveyLookup['die2_food3_choc_kind_dark']='r2.die2_food3_choc_kind_dark';
    surveyLookup['die2_food3_choc_kind_whit']='r2.die2_food3_choc_kind_whit';
    surveyLookup['die2_food3_choc_kind_998']='r2.die2_food3_choc_kind_998';
    surveyLookup['die2_food3_candy']='r2.die2_food3_candy';
    surveyLookup['die2_meal1_week_hamb']='r2.die2_meal1_week_hamb';
    surveyLookup['die2_meal1_week_minc']='r2.die2_meal1_week_minc';
    surveyLookup['die2_meal1_week_chic']='r2.die2_meal1_week_chic';
    surveyLookup['die2_meal1_week_saus']='r2.die2_meal1_week_saus';
    surveyLookup['die2_meal1_week_beef']='r2.die2_meal1_week_beef';
    surveyLookup['die2_meal1_week_lamb']='r2.die2_meal1_week_lamb';
    surveyLookup['die2_meal1_week_blac']='r2.die2_meal1_week_blac';
    surveyLookup['die2_meal1_mnt_hamb']='r2.die2_meal1_mnt_hamb';
    surveyLookup['die2_meal1_mnt_minc']='r2.die2_meal1_mnt_minc';
    surveyLookup['die2_meal1_mnt_chic']='r2.die2_meal1_mnt_chic';
    surveyLookup['die2_meal1_mnt_saus']='r2.die2_meal1_mnt_saus';
    surveyLookup['die2_meal1_mnt_beef']='r2.die2_meal1_mnt_beef';
    surveyLookup['die2_meal1_mnt_lamb']='r2.die2_meal1_mnt_lamb';
    surveyLookup['die2_meal1_mnt_blac']='r2.die2_meal1_mnt_blac';
    surveyLookup['die2_meal2_week_fish']='r2.die2_meal2_week_fish';
    surveyLookup['die2_meal2_week_salm']='r2.die2_meal2_week_salm';
    surveyLookup['die2_meal2_week_tuna']='r2.die2_meal2_week_tuna';
    surveyLookup['die2_meal2_week_vego']='r2.die2_meal2_week_vego';
    surveyLookup['die2_meal2_week_sall']='r2.die2_meal2_week_sall';
    surveyLookup['die2_meal2_week_bagu']='r2.die2_meal2_week_bagu';
    surveyLookup['die2_meal2_week_soup']='r2.die2_meal2_week_soup';
    surveyLookup['die2_meal2_week_pizz']='r2.die2_meal2_week_pizz';
    surveyLookup['die2_meal2_week_pann']='r2.die2_meal2_week_pann';
    surveyLookup['die2_meal2_mnt_fish']='r2.die2_meal2_mnt_fish';
    surveyLookup['die2_meal2_mnt_salm']='r2.die2_meal2_mnt_salm';
    surveyLookup['die2_meal2_mnt_tuna']='r2.die2_meal2_mnt_tuna';
    surveyLookup['die2_meal2_mnt_vego']='r2.die2_meal2_mnt_vego';
    surveyLookup['die2_meal2_mnt_sall']='r2.die2_meal2_mnt_sall';
    surveyLookup['die2_meal2_mnt_bagu']='r2.die2_meal2_mnt_bagu';
    surveyLookup['die2_meal2_mnt_soup']='r2.die2_meal2_mnt_soup';
    surveyLookup['die2_meal2_mnt_pizz']='r2.die2_meal2_mnt_pizz';
    surveyLookup['die2_meal2_mnt_pann']='r2.die2_meal2_mnt_pann';
    surveyLookup['die2_meal2_vego_bean']='r2.die2_meal2_vego_bean';
    surveyLookup['die2_meal2_vego_soya']='r2.die2_meal2_vego_soya';
    surveyLookup['die2_meal2_vego_quor']='r2.die2_meal2_vego_quor';
    surveyLookup['die2_meal2_vego_root']='r2.die2_meal2_vego_root';
    surveyLookup['die2_meal2_vego_998']='r2.die2_meal2_vego_998';
    surveyLookup['die2_meal2_sallad_ingr_past']='r2.die2_meal2_sallad_ingr_past';
    surveyLookup['die2_meal2_sallad_ingr_chee']='r2.die2_meal2_sallad_ingr_chee';
    surveyLookup['die2_meal2_sallad_ingr_ham']='r2.die2_meal2_sallad_ingr_ham';
    surveyLookup['die2_meal2_sallad_ingr_chic']='r2.die2_meal2_sallad_ingr_chic';
    surveyLookup['die2_meal2_sallad_ingr_salm']='r2.die2_meal2_sallad_ingr_salm';
    surveyLookup['die2_meal2_sallad_ingr_been']='r2.die2_meal2_sallad_ingr_been';
    surveyLookup['die2_meal2_sallad_ingr_oth']='r2.die2_meal2_sallad_ingr_oth';
    surveyLookup['die2_meal2_sallad_ingr_998']='r2.die2_meal2_sallad_ingr_998';
    surveyLookup['die2_meal2_baguette_chee']='r2.die2_meal2_baguette_chee';
    surveyLookup['die2_meal2_baguette_ham']='r2.die2_meal2_baguette_ham';
    surveyLookup['die2_meal2_baguette_chic']='r2.die2_meal2_baguette_chic';
    surveyLookup['die2_meal2_baguette_salm']='r2.die2_meal2_baguette_salm';
    surveyLookup['die2_meal2_baguette_vege']='r2.die2_meal2_baguette_vege';
    surveyLookup['die2_meal2_baguette_skag']='r2.die2_meal2_baguette_skag';
    surveyLookup['die2_meal2_baguette_oth']='r2.die2_meal2_baguette_oth';
    surveyLookup['die2_meal2_baguette_998']='r2.die2_meal2_baguette_998';
    surveyLookup['die2_meal2_soup_read']='r2.die2_meal2_soup_read';
    surveyLookup['die2_meal2_soup_fish']='r2.die2_meal2_soup_fish';
    surveyLookup['die2_meal2_soup_meat']='r2.die2_meal2_soup_meat';
    surveyLookup['die2_meal2_soup_pea']='r2.die2_meal2_soup_pea';
    surveyLookup['die2_meal2_soup_vege']='r2.die2_meal2_soup_vege';
    surveyLookup['die2_meal2_soup_oth']='r2.die2_meal2_soup_oth';
    surveyLookup['die2_meal2_soup_998']='r2.die2_meal2_soup_998';
    surveyLookup['die2_food4_week_pota']='r2.die2_food4_week_pota';
    surveyLookup['die2_food4_week_pomm']='r2.die2_food4_week_pomm';
    surveyLookup['die2_food4_week_past']='r2.die2_food4_week_past';
    surveyLookup['die2_food4_week_ricw']='r3.die2_food4_week_ricw';
    surveyLookup['die2_food4_week_cous']='r3.die2_food4_week_cous';
    surveyLookup['die2_food4_mnt_pota']='r3.die2_food4_mnt_pota';
    surveyLookup['die2_food4_mnt_pomm']='r3.die2_food4_mnt_pomm';
    surveyLookup['die2_food4_mnt_past']='r3.die2_food4_mnt_past';
    surveyLookup['die2_food4_mnt_ricw']='r3.die2_food4_mnt_ricw';
    surveyLookup['die2_food4_mnt_cous']='r3.die2_food4_mnt_cous';
    surveyLookup['die2_vege_week_mixv']='r3.die2_vege_week_mixv';
    surveyLookup['die2_vege_week_toma']='r3.die2_vege_week_toma';
    surveyLookup['die2_vege_week_spin']='r3.die2_vege_week_spin';
    surveyLookup['die2_vege_week_onio']='r3.die2_vege_week_onio';
    surveyLookup['die2_vege_week_carr']='r3.die2_vege_week_carr';
    surveyLookup['die2_vege_week_avoc']='r3.die2_vege_week_avoc';
    surveyLookup['die2_vege_week_brus']='r3.die2_vege_week_brus';
    surveyLookup['die2_vege_week_oliv']='r3.die2_vege_week_oliv';
    surveyLookup['die2_vege_mnt_mixv']='r3.die2_vege_mnt_mixv';
    surveyLookup['die2_vege_mnt_toma']='r3.die2_vege_mnt_toma';
    surveyLookup['die2_vege_mnt_spin']='r3.die2_vege_mnt_spin';
    surveyLookup['die2_vege_mnt_onio']='r3.die2_vege_mnt_onio';
    surveyLookup['die2_vege_mnt_carr']='r3.die2_vege_mnt_carr';
    surveyLookup['die2_vege_mnt_avoc']='r3.die2_vege_mnt_avoc';
    surveyLookup['die2_vege_mnt_brus']='r3.die2_vege_mnt_brus';
    surveyLookup['die2_vege_mnt_oliv']='r3.die2_vege_mnt_oliv';
    surveyLookup['die2_sauc_week_toma']='r3.die2_sauc_week_toma';
    surveyLookup['die2_sauc_week_vina']='r3.die2_sauc_week_vina';
    surveyLookup['die2_sauc_week_crem']='r3.die2_sauc_week_crem';
    surveyLookup['die2_sauc_mnt_toma']='r3.die2_sauc_mnt_toma';
    surveyLookup['die2_sauc_mnt_vina']='r3.die2_sauc_mnt_vina';
    surveyLookup['die2_sauc_mnt_crem']='r3.die2_sauc_mnt_crem';
    surveyLookup['die_port_pota_1']='r3.die_port_pota_1';
    surveyLookup['die_port_prot_1']='r3.die_port_prot_1';
    surveyLookup['die_port_vege_1']='r3.die_port_vege_1';
    surveyLookup['die_misc_fat_butt']='r3.die_misc_fat_butt';
    surveyLookup['die_misc_fat_marg']='r3.die_misc_fat_marg';
    surveyLookup['die_misc_fat_flyt']='r3.die_misc_fat_flyt';
    surveyLookup['die_misc_fat_mixt']='r3.die_misc_fat_mixt';
    surveyLookup['die_misc_fat_raps']='r3.die_misc_fat_raps';
    surveyLookup['die_misc_fat_oliv']='r3.die_misc_fat_oliv';
    surveyLookup['die_misc_fat_oil']='r3.die_misc_fat_oil';
    surveyLookup['die_misc_fat_oth']='r3.die_misc_fat_oth';
    surveyLookup['die_misc_fat_none']='r3.die_misc_fat_none';
    surveyLookup['die_misc_fat_998']='r3.die_misc_fat_998';
    surveyLookup['die_misc_salt_cook']='r3.die_misc_salt_cook';
    surveyLookup['die_misc_salt_food']='r3.die_misc_salt_food';
    surveyLookup['die_misc_salt_996']='r3.die_misc_salt_996';
    surveyLookup['die_misc_salt_998']='r3.die_misc_salt_998';
    surveyLookup['die_misc_light_frq']='r3.die_misc_light_frq';
    surveyLookup['die_misc_light_kind_soda']='r3.die_misc_light_kind_soda';
    surveyLookup['die_misc_light_kind_jam']='r3.die_misc_light_kind_jam';
    surveyLookup['die_misc_light_kind_chee']='r3.die_misc_light_kind_chee';
    surveyLookup['die_misc_light_kind_milk']='r3.die_misc_light_kind_milk';
    surveyLookup['die_misc_light_kind_crea']='r3.die_misc_light_kind_crea';
    surveyLookup['die_misc_light_kind_sauc']='r3.die_misc_light_kind_sauc';
    surveyLookup['die_misc_light_kind_prep']='r3.die_misc_light_kind_prep';
    surveyLookup['die_misc_light_kind_oth']='r3.die_misc_light_kind_oth';
    surveyLookup['die_misc_light_kind_998']='r3.die_misc_light_kind_998';
    surveyLookup['die_microwave_cont']='r3.die_microwave_cont';
    surveyLookup['die_packing_glas']='r3.die_packing_glas';
    surveyLookup['die_packing_cfis']='r3.die_packing_cfis';
    surveyLookup['die_packing_cmea']='r3.die_packing_cmea';
    surveyLookup['die_packing_cveg']='r3.die_packing_cveg';
    surveyLookup['die_packing_cfru']='r3.die_packing_cfru';
    surveyLookup['die_packing_tube']='r3.die_packing_tube';
    surveyLookup['die2_habits_fast']='r3.die2_habits_fast';
    surveyLookup['die2_habits_rest']='r3.die2_habits_rest';
    surveyLookup['die2_habits_996']='r3.die2_habits_996';
    surveyLookup['die2_habits_998']='r3.die2_habits_998';
    surveyLookup['die2_restaurant']='r3.die2_restaurant';
    surveyLookup['die2_suppl_use']='r3.die2_suppl_use';
    surveyLookup['die_suppl_oth_beta']='r3.die_suppl_oth_beta';
    surveyLookup['die_suppl_oth_vitb']='r3.die_suppl_oth_vitb';
    surveyLookup['die_suppl_oth_sele']='r3.die_suppl_oth_sele';
    surveyLookup['die_suppl_oth_zink']='r3.die_suppl_oth_zink';
    surveyLookup['die_suppl_oth_magn']='r3.die_suppl_oth_magn';
    surveyLookup['die_suppl_oth_q10']='r3.die_suppl_oth_q10';
    surveyLookup['die_suppl_oth_anti']='r3.die_suppl_oth_anti';
    surveyLookup['die_suppl_oth_phyt']='r3.die_suppl_oth_phyt';
    surveyLookup['die_suppl_oth_oth']='r3.die_suppl_oth_oth';
    surveyLookup['die_suppl_oth_996']='r3.die_suppl_oth_996';
    surveyLookup['die_suppl_oth_998']='r3.die_suppl_oth_998';
    surveyLookup['phy_occact_1']='r3.phy_occact_1';
    surveyLookup['phy_leiact_activity_1']='r3.phy_leiact_activity_1';
    surveyLookup['phy_activities_leisure']='r3.phy_activities_leisure';
    surveyLookup['phy_activities_bed']='r3.phy_activities_bed';
    surveyLookup['phy_activities_tv']='r3.phy_activities_tv';
    surveyLookup['phy_activities_sit']='r3.phy_activities_sit';
    surveyLookup['phy_activities_sta']='r3.phy_activities_sta';
    surveyLookup['phy_activities_wslo']='r3.phy_activities_wslo';
    surveyLookup['phy_activities_wfas']='r3.phy_activities_wfas';
    surveyLookup['phy_activities_low']='r3.phy_activities_low';
    surveyLookup['phy_activities_mod']='r3.phy_activities_mod';
    surveyLookup['phy_activities_hig']='r3.phy_activities_hig';
    surveyLookup['wom_mensfirst']='r3.wom_mensfirst';
    surveyLookup['wom_mensfirst_yrs_other']='r3.wom_mensfirst_yrs_other';
    surveyLookup['wom_lstyr_period']='r3.wom_lstyr_period';
    surveyLookup['wom_lstyr_reason']='r3.wom_lstyr_reason';
    surveyLookup['wom_cycle']='r3.wom_cycle';
    surveyLookup['wom_contr_min']='r3.wom_contr_min';
    surveyLookup['wom_contr_com']='r3.wom_contr_com';
    surveyLookup['wom_contr_pin']='r3.wom_contr_pin';
    surveyLookup['wom_contr_coi']='r3.wom_contr_coi';
    surveyLookup['wom_contr_pim']='r3.wom_contr_pim';
    surveyLookup['wom_contr_oth']='r3.wom_contr_oth';
    surveyLookup['wom_contr_no']='r3.wom_contr_no';
    surveyLookup['wom_contr_998']='r3.wom_contr_998';
    surveyLookup['wom_pregn']='r3.wom_pregn';
    surveyLookup['wom_pregn_nbr']='r3.wom_pregn_nbr';
    surveyLookup['wom_pregn_nbr_tms_other']='r3.wom_pregn_nbr_tms_other';
    surveyLookup['wom_pregn_now']='r3.wom_pregn_now';
    surveyLookup['wom_birth']='r3.wom_birth';
    surveyLookup['wom_birth_nbr']='r3.wom_birth_nbr';
    surveyLookup['wom_birth_nbr_tms_other']='r3.wom_birth_nbr_tms_other';
    surveyLookup['wom_preeklampsi']='r3.wom_preeklampsi';
    surveyLookup['wom_op_whc_cerv']='r3.wom_op_whc_cerv';
    surveyLookup['wom_op_whc_uter']='r3.wom_op_whc_uter';
    surveyLookup['wom_op_whc_ovar']='r3.wom_op_whc_ovar';
    surveyLookup['wom_op_whc_ster']='r3.wom_op_whc_ster';
    surveyLookup['wom_op_whc_abor']='r3.wom_op_whc_abor';
    surveyLookup['wom_op_whc_chem']='r3.wom_op_whc_chem';
    surveyLookup['wom_op_whc_comp']='r3.wom_op_whc_comp';
    surveyLookup['wom_op_whc_oth']='r3.wom_op_whc_oth';
    surveyLookup['wom_op_whc_no']='r3.wom_op_whc_no';
    surveyLookup['wom_op_whc_998']='r3.wom_op_whc_998';
    surveyLookup['wom_pco']='r3.wom_pco';
    surveyLookup['wom_diagendomet']='r3.wom_diagendomet';
    surveyLookup['wom_menopause']='r3.wom_menopause';
    surveyLookup['wom_menopause_age']='r3.wom_menopause_age';
    surveyLookup['wom_menopause_age_yrs_other']='r3.wom_menopause_age_yrs_other';
    surveyLookup['wom2_menopause_treat1_est']='r3.wom2_menopause_treat1_est';
    surveyLookup['wom2_menopause_treat1_epc']='r3.wom2_menopause_treat1_epc';
    surveyLookup['wom2_menopause_treat1_no']='r3.wom2_menopause_treat1_no';
    surveyLookup['wom2_menopause_treat1_998']='r3.wom2_menopause_treat1_998';
    surveyLookup['smo_onewhole']='r3.smo_onewhole';
    surveyLookup['smo_life']='r3.smo_life';
    surveyLookup['smo_most']='r3.smo_most';
    surveyLookup['smo_most_age']='r3.smo_most_age';
    surveyLookup['smo_most_age_yrs_other']='r3.smo_most_age_yrs_other';
    surveyLookup['smo_years']='r3.smo_years';
    surveyLookup['smo_amount']='r3.smo_amount';
    surveyLookup['smo_amount_nbr_other']='r3.smo_amount_nbr_other';
    surveyLookup['smo_present']='r3.smo_present';
    surveyLookup['smo_quitage']='r3.smo_quitage';
    surveyLookup['smo_quitage_yrs_other']='r3.smo_quitage_yrs_other';
    surveyLookup['smo_presamount']='r3.smo_presamount';
    surveyLookup['smo_presamount_nbr_other']='r3.smo_presamount_nbr_other';
    surveyLookup['smo_others_place_hou']='r3.smo_others_place_hou';
    surveyLookup['smo_others_place_hou_other']='r3.smo_others_place_hou_other';
    surveyLookup['smo_others_place_wor']='r3.smo_others_place_wor';
    surveyLookup['smo_others_place_wor_other']='r3.smo_others_place_wor_other';
    surveyLookup['smo_others_place_res']='r3.smo_others_place_res';
    surveyLookup['smo_others_place_res_other']='r3.smo_others_place_res_other';
    surveyLookup['smo_others_place_oth']='r3.smo_others_place_oth';
    surveyLookup['smo_others_place_oth_other']='r3.smo_others_place_oth_other';
    surveyLookup['smo_others_place_5']='r3.smo_others_place_5';
    surveyLookup['smo_others_place_998']='r3.smo_others_place_998';
    surveyLookup['snu_tried']='r3.snu_tried';
    surveyLookup['snu_life']='r3.snu_life';
    surveyLookup['snu_most']='r3.snu_most';
    surveyLookup['snu_most_age']='r3.snu_most_age';
    surveyLookup['snu_most_age_yrs_other']='r3.snu_most_age_yrs_other';
    surveyLookup['snu_years']='r3.snu_years';
    surveyLookup['snu_amount']='r3.snu_amount';
    surveyLookup['snu_present']='r3.snu_present';
    surveyLookup['snu_quitage']='r3.snu_quitage';
    surveyLookup['snu_quitage_yrs_other']='r3.snu_quitage_yrs_other';
    surveyLookup['snu_presamount']='r3.snu_presamount';
    surveyLookup['alc_fulldrink']='r3.alc_fulldrink';
    surveyLookup['alc_drink_frq']='r3.alc_drink_frq';
    surveyLookup['alc_drink_summ']='r3.alc_drink_summ';
    surveyLookup['alc_12mnts_frqocc']='r3.alc_12mnts_frqocc';
    surveyLookup['alc_audit_4']='r3.alc_audit_4';
    surveyLookup['alc_audit_5']='r3.alc_audit_5';
    surveyLookup['alc_audit_6']='r3.alc_audit_6';
    surveyLookup['alc_audit_7']='r3.alc_audit_7';
    surveyLookup['alc_audit_8']='r3.alc_audit_8';
    surveyLookup['alc_audit_9']='r3.alc_audit_9';
    surveyLookup['alc_audit_10']='r3.alc_audit_10';
    surveyLookup['dis_teethcount']='r3.dis_teethcount';
    surveyLookup['dis_teethcount_nbr_other']='r3.dis_teethcount_nbr_other';
    surveyLookup['dis_infection']='r3.dis_infection';
    surveyLookup['dis_fluvaccine']='r3.dis_fluvaccine';
    surveyLookup['dis_1_hibl']='r3.dis_1_hibl';
    surveyLookup['dis_1_hift']='r3.dis_1_hift';
    surveyLookup['dis_1_angp']='r3.dis_1_angp';
    surveyLookup['dis_1_hear']='r3.dis_1_hear';
    surveyLookup['dis_1_stro']='r3.dis_1_stro';
    surveyLookup['dis_1_fibr']='r3.dis_1_fibr';
    surveyLookup['dis_1_fail']='r3.dis_1_fail';
    surveyLookup['dis_1_vasc']='r3.dis_1_vasc';
    surveyLookup['dis_1_clau']='r3.dis_1_clau';
    surveyLookup['dis_1_ampu']='r3.dis_1_ampu';
    surveyLookup['dis_1_asth']='r3.dis_1_asth';
    surveyLookup['dis_1_copd']='r3.dis_1_copd';
    surveyLookup['dis_1_othl']='r3.dis_1_othl';
    surveyLookup['dis_1_psor']='r3.dis_1_psor';
    surveyLookup['dis_1_diab']='r3.dis_1_diab';
    surveyLookup['dis_1_thyr']='r3.dis_1_thyr';
    surveyLookup['dis_1_spru']='r3.dis_1_spru';
    surveyLookup['dis_1_stom']='r3.dis_1_stom';
    surveyLookup['dis_1_ulce']='r3.dis_1_ulce';
    surveyLookup['dis_1_urin']='r3.dis_1_urin';
    surveyLookup['dis_1_pros']='r3.dis_1_pros';
    surveyLookup['dis_1_kidn']='r3.dis_1_kidn';
    surveyLookup['dis_1_gall']='r3.dis_1_gall';
    surveyLookup['dis_1_996']='r3.dis_1_996';
    surveyLookup['dis_1_998']='r3.dis_1_998';
    surveyLookup['dis_2_artr']='r3.dis_2_artr';
    surveyLookup['dis_2_back']='r3.dis_2_back';
    surveyLookup['dis_2_rheu']='r3.dis_2_rheu';
    surveyLookup['dis_2_vert']='r3.dis_2_vert';
    surveyLookup['dis_2_oste']='r3.dis_2_oste';
    surveyLookup['dis_2_park']='r3.dis_2_park';
    surveyLookup['dis_2_anem']='r3.dis_2_anem';
    surveyLookup['dis_2_urem']='r3.dis_2_urem';
    surveyLookup['dis_2_migr']='r3.dis_2_migr';
    surveyLookup['dis_2_epil']='r3.dis_2_epil';
    surveyLookup['dis_2_depr']='r3.dis_2_depr';
    surveyLookup['die2_food1a_musli_corn']='r3.die2_food1a_musli_corn';
    surveyLookup['die2_food1a_musli_star']='r3.die2_food1a_musli_star';
    surveyLookup['die2_food1a_musli_musl']='r3.die2_food1a_musli_musl';
    surveyLookup['dis_2_bipo']='r4.dis_2_bipo';
    surveyLookup['dis_2_gad']='r4.dis_2_gad';
    surveyLookup['dis_2_can']='r4.dis_2_can';
    surveyLookup['dis_2_oth']='r4.dis_2_oth';
    surveyLookup['dis_2_oth_other']='r4.dis_2_oth_other';
    surveyLookup['dis_2_996']='r4.dis_2_996';
    surveyLookup['dis_2_998']='r4.dis_2_998';
    surveyLookup['dis_bladder_night']='r4.dis_bladder_night';
    surveyLookup['dis_bladder_difficulties']='r4.dis_bladder_difficulties';
    surveyLookup['dis_bladder_often']='r4.dis_bladder_often';
    surveyLookup['dis_bladder_often_bother']='r4.dis_bladder_often_bother';
    surveyLookup['dis_bladder_leak']='r4.dis_bladder_leak';
    surveyLookup['dis_bladder_leak_bother']='r4.dis_bladder_leak_bother';
    surveyLookup['dis_weightmost']='r4.dis_weightmost';
    surveyLookup['dis_weightmost_kg_other']='r4.dis_weightmost_kg_other';
    surveyLookup['dis_weightmost_age']='r4.dis_weightmost_age';
    surveyLookup['dis_weightmost_age_yrs_other']='r4.dis_weightmost_age_yrs_other';
    surveyLookup['dis_weight_20yr']='r4.dis_weight_20yr';
    surveyLookup['dis_weight_20yr_kg_other']='r4.dis_weight_20yr_kg_other';
    surveyLookup['dis_length_20yr']='r4.dis_length_20yr';
    surveyLookup['dis_length_20yr_cm_other']='r4.dis_length_20yr_cm_other';
    surveyLookup['dis_aneur']='r4.dis_aneur';
    surveyLookup['dis_aneur_where']='r4.dis_aneur_where';
    surveyLookup['dis_aneur_hospital']='r4.dis_aneur_hospital';
    surveyLookup['dis_aneur_oper_reason']='r4.dis_aneur_oper_reason';
    surveyLookup['dis_aneur_relative']='r4.dis_aneur_relative';
    surveyLookup['dis_aneur_relative_where']='r4.dis_aneur_relative_where';
    surveyLookup['pai_ever_3mnt']='r4.pai_ever_3mnt';
    surveyLookup['pai_lstyr_3mnt']='r4.pai_lstyr_3mnt';
    surveyLookup['pai_knee_frq']='r4.pai_knee_frq';
    surveyLookup['pai_knee_trust']='r4.pai_knee_trust';
    surveyLookup['pai_knee_lifestyle']='r4.pai_knee_lifestyle';
    surveyLookup['pai_knee_genprob']='r4.pai_knee_genprob';
    surveyLookup['pai_hips_frq']='r4.pai_hips_frq';
    surveyLookup['pai_hips_trust']='r4.pai_hips_trust';
    surveyLookup['pai_hips_lifestyle']='r4.pai_hips_lifestyle';
    surveyLookup['pai_hips_genprob']='r4.pai_hips_genprob';
    surveyLookup['pai_whc_head']='r4.pai_whc_head';
    surveyLookup['pai_whc_shol']='r4.pai_whc_shol';
    surveyLookup['pai_whc_elbl']='r4.pai_whc_elbl';
    surveyLookup['pai_whc_wril']='r4.pai_whc_wril';
    surveyLookup['pai_whc_hanl']='r4.pai_whc_hanl';
    surveyLookup['pai_whc_brea']='r4.pai_whc_brea';
    surveyLookup['pai_whc_stom']='r4.pai_whc_stom';
    surveyLookup['pai_whc_butl']='r4.pai_whc_butl';
    surveyLookup['pai_whc_hipl']='r4.pai_whc_hipl';
    surveyLookup['pai_whc_knel']='r4.pai_whc_knel';
    surveyLookup['pai_whc_fool']='r4.pai_whc_fool';
    surveyLookup['pai_whc_bnec']='r4.pai_whc_bnec';
    surveyLookup['pai_whc_shor']='r4.pai_whc_shor';
    surveyLookup['pai_whc_elbr']='r4.pai_whc_elbr';
    surveyLookup['pai_whc_wrir']='r4.pai_whc_wrir';
    surveyLookup['pai_whc_hanr']='r4.pai_whc_hanr';
    surveyLookup['pai_whc_bacu']='r4.pai_whc_bacu';
    surveyLookup['pai_whc_bacl']='r4.pai_whc_bacl';
    surveyLookup['pai_whc_butr']='r4.pai_whc_butr';
    surveyLookup['pai_whc_hipr']='r4.pai_whc_hipr';
    surveyLookup['pai_whc_kner']='r4.pai_whc_kner';
    surveyLookup['pai_whc_foor']='r4.pai_whc_foor';
    surveyLookup['pai_whc_996']='r4.pai_whc_996';
    surveyLookup['pai_whc_998']='r4.pai_whc_998';
    surveyLookup['pai_headache']='r4.pai_headache';
    surveyLookup['pai_headache_dur']='r4.pai_headache_dur';
    surveyLookup['pai_headache_sev_1mnt']='r4.pai_headache_sev_1mnt';
    surveyLookup['pai_bnecache_12mnt']='r4.pai_bnecache_12mnt';
    surveyLookup['pai_bnecache_sev_1mnt']='r4.pai_bnecache_sev_1mnt';
    surveyLookup['pai_shouache_12mnt']='r4.pai_shouache_12mnt';
    surveyLookup['pai_shouache_sev_1mnt']='r4.pai_shouache_sev_1mnt';
    surveyLookup['pai_wrisache_12mnt']='r4.pai_wrisache_12mnt';
    surveyLookup['pai_wrisache_sev_1mnt']='r4.pai_wrisache_sev_1mnt';
    surveyLookup['pai_handache_12mnt']='r4.pai_handache_12mnt';
    surveyLookup['pai_handache_sev_1mnt']='r4.pai_handache_sev_1mnt';
    surveyLookup['pai_breaache_12mnt']='r4.pai_breaache_12mnt';
    surveyLookup['pai_breaache_sev_1mnt']='r4.pai_breaache_sev_1mnt';
    surveyLookup['pai_backache_12mnt']='r4.pai_backache_12mnt';
    surveyLookup['pai_backache_sev_1mnt']='r4.pai_backache_sev_1mnt';
    surveyLookup['pai_stomache_12mnt']='r4.pai_stomache_12mnt';
    surveyLookup['pai_stomache_sev_1mnt']='r4.pai_stomache_sev_1mnt';
    surveyLookup['pai_hipsache_12mnt']='r4.pai_hipsache_12mnt';
    surveyLookup['pai_hipsache_sev_1mnt']='r4.pai_hipsache_sev_1mnt';
    surveyLookup['pai_kneeache_12mnt']='r4.pai_kneeache_12mnt';
    surveyLookup['pai_kneeache_sev_1mnt']='r4.pai_kneeache_sev_1mnt';
    surveyLookup['pai_balance']='r4.pai_balance';
    surveyLookup['pai_balance_chngyr']='r4.pai_balance_chngyr';
    surveyLookup['sle_general_gen']='r4.sle_general_gen';
    surveyLookup['sle_sleephrs']='r4.sle_sleephrs';
    surveyLookup['sle_needhrs_rested']='r4.sle_needhrs_rested';
    surveyLookup['sle_morneven_type_sle']='r4.sle_morneven_type_sle';
    surveyLookup['sle_tosleep']='r4.sle_tosleep';
    surveyLookup['sle_sleep_qual_hard']='r4.sle_sleep_qual_hard';
    surveyLookup['sle_sleep_qual_worr']='r4.sle_sleep_qual_worr';
    surveyLookup['sle_sleep_qual_seve']='r4.sle_sleep_qual_seve';
    surveyLookup['sle_sleep_qual_earl']='r4.sle_sleep_qual_earl';
    surveyLookup['sle_sleep_qual_notr']='r4.sle_sleep_qual_notr';
    surveyLookup['sle_sleep_qual_shor']='r4.sle_sleep_qual_shor';
    surveyLookup['sle_sleep_qual_legs']='r4.sle_sleep_qual_legs';
    surveyLookup['sle_sleep_qual_snor']='r4.sle_sleep_qual_snor';
    surveyLookup['sle_sleep_qual_brea']='r4.sle_sleep_qual_brea';
    surveyLookup['sle_sleep_qual_daya']='r4.sle_sleep_qual_daya';
    surveyLookup['sle_sleep_qual_dayt']='r4.sle_sleep_qual_dayt';
    surveyLookup['sle_apne_diag']='r4.sle_apne_diag';
    surveyLookup['sle_apne_means_gadv']='r4.sle_apne_means_gadv';
    surveyLookup['sle_apne_means_oper']='r4.sle_apne_means_oper';
    surveyLookup['sle_apne_means_cpap']='r4.sle_apne_means_cpap';
    surveyLookup['sle_apne_means_spli']='r4.sle_apne_means_spli';
    surveyLookup['sle_apne_means_no']='r4.sle_apne_means_no';
    surveyLookup['sle_apne_means_998']='r4.sle_apne_means_998';
    surveyLookup['sle_apne_means_frq']='r4.sle_apne_means_frq';
    surveyLookup['sle_doze_rea']='r4.sle_doze_rea';
    surveyLookup['sle_doze_tv']='r4.sle_doze_tv';
    surveyLookup['sle_doze_pub']='r4.sle_doze_pub';
    surveyLookup['sle_doze_pas']='r4.sle_doze_pas';
    surveyLookup['sle_doze_res']='r4.sle_doze_res';
    surveyLookup['sle_doze_tal']='r4.sle_doze_tal';
    surveyLookup['sle_doze_eat']='r4.sle_doze_eat';
    surveyLookup['sle_doze_car']='r4.sle_doze_car';
    surveyLookup['inj_1']='r4.inj_1';
    surveyLookup['inj_1_5']='r4.inj_1_5';
    surveyLookup['inj_17']='r4.inj_17';
    surveyLookup['inj_18']='r4.inj_18';
    surveyLookup['inj_19']='r4.inj_19';
    surveyLookup['ast_12mnt_wheez']='r4.ast_12mnt_wheez';
    surveyLookup['ast_whz_frq']='r4.ast_whz_frq';
    surveyLookup['ast_12mnt_stren']='r4.ast_12mnt_stren';
    surveyLookup['ast_12mnt_wake']='r4.ast_12mnt_wake';
    surveyLookup['ast_asthma']='r4.ast_asthma';
    surveyLookup['ast_asthma_diag']='r4.ast_asthma_diag';
    surveyLookup['ast_asthma_diag_age_estim']='r4.ast_asthma_diag_age_estim';
    surveyLookup['ast_first_age']='r4.ast_first_age';
    surveyLookup['ast_first_age_yrs_other']='r4.ast_first_age_yrs_other';
    surveyLookup['ast_first_age_estim']='r4.ast_first_age_estim';
    surveyLookup['ast_breathtimes']='r4.ast_breathtimes';
    surveyLookup['ast_waketimes']='r4.ast_waketimes';
    surveyLookup['ast_interfered']='r4.ast_interfered';
    surveyLookup['ast_med']='r4.ast_med';
    surveyLookup['cop_cou_3mnt']='r4.cop_cou_3mnt';
    surveyLookup['cop_cou_3mnt_yr']='r4.cop_cou_3mnt_yr';
    surveyLookup['cop_phl_3mnt']='r4.cop_phl_3mnt';
    surveyLookup['cop_phl_yr']='r4.cop_phl_yr';
    surveyLookup['cop_disabled_reason']='r4.cop_disabled_reason';
    surveyLookup['cop_disabled_hurry']='r4.cop_disabled_hurry';
    surveyLookup['cop_disabled_walkothers']='r4.cop_disabled_walkothers';
    surveyLookup['cop_disabled_stoprest']='r4.cop_disabled_stoprest';
    surveyLookup['cop_disabled_selfcare']='r4.cop_disabled_selfcare';
    surveyLookup['cop_diag_bron']='r4.cop_diag_bron';
    surveyLookup['cop_diag_copd']='r4.cop_diag_copd';
    surveyLookup['cop_diag_emph']='r4.cop_diag_emph';
    surveyLookup['cop_diag_no']='r4.cop_diag_no';
    surveyLookup['cop_diag_998']='r4.cop_diag_998';
    surveyLookup['cop_causalitydep_6mnt']='r4.cop_causalitydep_6mnt';
    surveyLookup['cop_emergency_6mnt']='r4.cop_emergency_6mnt';
    surveyLookup['cop_hospitalized_6mnt']='r4.cop_hospitalized_6mnt';
    surveyLookup['all_nasal']='r4.all_nasal';
    surveyLookup['all_nasal_12mnt']='r4.all_nasal_12mnt';
    surveyLookup['all_non']='r4.all_non';
    surveyLookup['all_itchwat_eyes']='r4.all_itchwat_eyes';
    surveyLookup['all_nasal_diag']='r4.all_nasal_diag';
    surveyLookup['all_rhinit_stu']='r4.all_rhinit_stu';
    surveyLookup['all_rhinit_dis']='r4.all_rhinit_dis';
    surveyLookup['all_rhinit_fac']='r4.all_rhinit_fac';
    surveyLookup['all_rhinit_red']='r4.all_rhinit_red';
    surveyLookup['all_rhinit_no']='r4.all_rhinit_no';
    surveyLookup['all_rhinit_998']='r4.all_rhinit_998';
    surveyLookup['all_chronrhinit_diag']='r4.all_chronrhinit_diag';
    surveyLookup['scr_sc21']='r4.scr_sc21';
    surveyLookup['scr_sc23']='r4.scr_sc23';
    surveyLookup['dep2_d2_clo']='r4.dep2_d2_clo';
    surveyLookup['dep2_d2_bod']='r4.dep2_d2_bod';
    surveyLookup['dep2_d2_oth']='r4.dep2_d2_oth';
    surveyLookup['dep2_d2_no']='r4.dep2_d2_no';
    surveyLookup['dep2_d2_998']='r4.dep2_d2_998';
    surveyLookup['mem_relativefunction']='r4.mem_relativefunction';
    surveyLookup['mem_worsened']='r4.mem_worsened';
    surveyLookup['mem_solveproblem']='r4.mem_solveproblem';
    surveyLookup['mem_findway']='r4.mem_findway';
    surveyLookup['mem_cap_pres']='r4.mem_cap_pres';
    surveyLookup['qua_stress_11']='r4.qua_stress_11';
    surveyLookup['ibs_stomrecur']='r4.ibs_stomrecur';
    surveyLookup['ibs_stomrecur_lasts']='r4.ibs_stomrecur_lasts';
    surveyLookup['ibs_stomrecur_age']='r4.ibs_stomrecur_age';
    surveyLookup['ibs_stomrecur_discomf_sat']='r4.ibs_stomrecur_discomf_sat';
    surveyLookup['ibs_stomrecur_discomf_blo']='r4.ibs_stomrecur_discomf_blo';
    surveyLookup['ibs_stomrecur_discomf_con']='r4.ibs_stomrecur_discomf_con';
    surveyLookup['ibs_stomrecur_discomf_loo']='r4.ibs_stomrecur_discomf_loo';
    surveyLookup['ibs_stomrecur_discomf_inc']='r4.ibs_stomrecur_discomf_inc';
    surveyLookup['ibs_stomrecur_discomf_all']='r4.ibs_stomrecur_discomf_all';
    surveyLookup['ibs_stomrecur_discomf_996']='r4.ibs_stomrecur_discomf_996';
    surveyLookup['ibs_stomrecur_discomf_998']='r4.ibs_stomrecur_discomf_998';
    surveyLookup['ibs_stomrecur_where_upp']='r4.ibs_stomrecur_where_upp';
    surveyLookup['ibs_stomrecur_where_low']='r4.ibs_stomrecur_where_low';
    surveyLookup['ibs_stomrecur_where_bot']='r4.ibs_stomrecur_where_bot';
    surveyLookup['ibs_stomrecur_where_998']='r4.ibs_stomrecur_where_998';
    surveyLookup['ibs_stomrecur_pain_rel']='r4.ibs_stomrecur_pain_rel';
    surveyLookup['ibs_stomrecur_pain_tri']='r4.ibs_stomrecur_pain_tri';
    surveyLookup['ibs_stomrecur_pain_lac']='r4.ibs_stomrecur_pain_lac';
    surveyLookup['ibs_stomrecur_pain_wak']='r4.ibs_stomrecur_pain_wak';
    surveyLookup['ibs_stomrecur_pain_996']='r4.ibs_stomrecur_pain_996';
    surveyLookup['ibs_stomrecur_pain_998']='r4.ibs_stomrecur_pain_998';
    surveyLookup['ibs_stompain_aftermeal']='r4.ibs_stompain_aftermeal';
    surveyLookup['ibs_stompain_nomeal']='r4.ibs_stompain_nomeal';
    surveyLookup['inj_1_7']='r5.inj_1_7';
    surveyLookup['inj_1_8_1']='r5.inj_1_8_1';
    surveyLookup['inj_1_8_2']='r5.inj_1_8_2';
    surveyLookup['inj_1_8_3']='r5.inj_1_8_3';
    surveyLookup['inj_1_8_4']='r5.inj_1_8_4';
    surveyLookup['inj_1_8_5']='r5.inj_1_8_5';
    surveyLookup['inj_1_8_6']='r5.inj_1_8_6';
    surveyLookup['inj_1_8_7']='r5.inj_1_8_7';
    surveyLookup['inj_1_8_8']='r5.inj_1_8_8';
    surveyLookup['inj_1_8_9']='r5.inj_1_8_9';
    surveyLookup['inj_1_8_10']='r5.inj_1_8_10';
    surveyLookup['inj_1_8_11']='r5.inj_1_8_11';
    surveyLookup['inj_1_8_12']='r5.inj_1_8_12';
    surveyLookup['inj_1_8_13']='r5.inj_1_8_13';
    surveyLookup['inj_1_8_14']='r5.inj_1_8_14';
    surveyLookup['inj_1_8_15']='r5.inj_1_8_15';
    surveyLookup['inj_1_8_16']='r5.inj_1_8_16';
    surveyLookup['inj_1_8_17']='r5.inj_1_8_17';
    surveyLookup['inj_1_8_998']='r5.inj_1_8_998';
    surveyLookup['sel2_nonpresc_996']='r3.sel2_nonpresc_996';
    surveyLookup['sel2_nonpresc_998']='r3.sel2_nonpresc_998';
    surveyLookup['sel2_nonpresc_alv']='r3.sel2_nonpresc_alv';
    surveyLookup['sel2_nonpresc_frq_alv']='r3.sel2_nonpresc_frq_alv';
    surveyLookup['sel2_nonpresc_frq_ibu']='r3.sel2_nonpresc_frq_ibu';
    surveyLookup['sel2_nonpresc_frq_tre']='r3.sel2_nonpresc_frq_tre';
    surveyLookup['sel2_nonpresc_frq_vol']='r3.sel2_nonpresc_frq_vol';
    surveyLookup['sel2_nonpresc_ibu']='r3.sel2_nonpresc_ibu';
    surveyLookup['sel2_nonpresc_tre']='r3.sel2_nonpresc_tre';
    surveyLookup['sel2_nonpresc_vol']='r3.sel2_nonpresc_vol';
    surveyLookup['sel2_prod_ome3']='r3.sel2_prod_ome3';
    surveyLookup['sel2_prod_mult']='r3.sel2_prod_mult';
    surveyLookup['sel2_prod_esbe']='r3.sel2_prod_esbe';
    surveyLookup['sel2_prod_gluc']='r3.sel2_prod_gluc';
    surveyLookup['sel2_prod_996']='r3.sel2_prod_996';
    surveyLookup['sel2_prod_998']='r3.sel2_prod_998';
    surveyLookup['die2_suppl_vit_frq_mult']='r3.die2_suppl_vit_frq_mult';
    surveyLookup['die2_suppl_vit_frq_vita']='r3.die2_suppl_vit_frq_vita';
    surveyLookup['die2_suppl_vit_frq_vitb']='r3.die2_suppl_vit_frq_vitb';
    surveyLookup['die2_suppl_vit_frq_vitc']='r3.die2_suppl_vit_frq_vitc';
    surveyLookup['die2_suppl_vit_frq_vitd']='r3.die2_suppl_vit_frq_vitd';
    surveyLookup['die2_suppl_vit_frq_vite']='r3.die2_suppl_vit_frq_vite';
    surveyLookup['die2_suppl_vit_frq_foli']='r3.die2_suppl_vit_frq_foli';
    surveyLookup['die2_suppl_vit_frq_iron']='r3.die2_suppl_vit_frq_iron';
    surveyLookup['die2_suppl_vit_frq_calc']='r3.die2_suppl_vit_frq_calc';
    surveyLookup['die2_food2_mnt_othf']='r2.die2_food2_mnt_othf';
    surveyLookup['die2_food2_week_othf']='r2.die2_food2_week_othf';
    surveyLookup['inj_12_16_car']='r4.inj_12_16_car';
    surveyLookup['inj_12_16_com']='r4.inj_12_16_com';
    surveyLookup['inj_12_16_hea']='r4.inj_12_16_hea';
    surveyLookup['inj_12_16_rem']='r4.inj_12_16_rem';
    surveyLookup['inj_12_16_see']='r4.inj_12_16_see';
    surveyLookup['ast_asthma_diag_age']='r4.ast_asthma_diag_age';
    surveyLookup['ast_asthma_diag_age_yrs_other']='r4.ast_asthma_diag_age_yrs_other';

    return surveyLookup;
};