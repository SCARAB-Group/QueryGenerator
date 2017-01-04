# QueryGenerator
Generate SQL queries for data withdrawals

Open the website in a browser and select the variables that should be included in the data withdrawal. The webpage then generates the complete SQL query.

The queries are based on the withdrawal ID ("Request Id") that is generated when running the query that fetches the physical measurements from LIMS. The other queries uses the Request Id in order to fetch values from the same participants and to perform faster.

Run the queries in the following order:
* LIMS physical values
* EKG values (ResultManager)
* Blood analysis values (ResultManager)
* Survey data
