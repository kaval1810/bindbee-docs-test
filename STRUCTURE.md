# Bindbee docs — structure (v3)

Generated from `docs.json` on 2026-08-24 at commit `917747e`.
Run `python3 scripts/gen-structure.py` to refresh; hand edits will drift from the nav.

## Summary

| Tab | Pages |
| --- | ---: |
| Get Started | 16 |
| Guide | 27 |
| API Reference | 143 |
| **Total in nav** | **186** |

**50** are editorial pages written by hand. The other **136** render from `spec.json` via an `openapi:` line — 17 of those also carry a hand-written title, so they read like editorial pages in the sidebar but their body is generated.
`docs.json` also carries **216** redirects.

### Reading the tree

- A trailing `/` marks a group rather than a page.
- Brackets carry the group's `docs.json` flags: a tag (`BETA`), `expanded` if it opens by default, and the Lucide icon name.
- Page rows show the **sidebar label**, then the path. What follows `·` is context: for an editorial page it is the `title` where that differs from the `sidebarTitle`; for an endpoint page it is the operation the body is generated from.
- A row with no `·` and no method is an editorial page.

## Tree

```
Get Started
├── Introduction/
│   ├── What is Bindbee?   (get-started/what-is-bindbee)
│   ├── Quickstart   (get-started/quickstart)
│   └── Platform   (get-started/platform)
├── Core Concepts/
│   ├── Overview   (get-started/core-concepts)  ·  title: Core concepts
│   ├── Environments   (get-started/environments)
│   ├── How to connect   (get-started/how-to-connect)
│   ├── Scoping   (get-started/scoping)
│   └── Connection methods   (get-started/connection-methods)
├── Integrations/
│   ├── Integration & Coverage   (get-started/integrations)
│   └── Model Availability Matrix   (get-started/model-availability)  ·  title: Model availability
└── Use Cases/
    ├── Sync census data   (get-started/use-cases/sync-census-data)  ·  title: Sync Census Data for Quoting
    ├── Identify a termination   (get-started/use-cases/identify-a-termination)  ·  title: Cascade a Termination Downstream
    ├── Read benefit coverage   (get-started/use-cases/read-benefit-coverage)  ·  title: Read Benefit Coverage
    ├── Write ICHRA deductions   (get-started/use-cases/write-ichra-deductions)  ·  title: Write Payroll Deductions Back to Payroll
    ├── Create an employee   (get-started/use-cases/create-an-employee)  ·  title: Create an Employee
    └── Write payroll deductions   (get-started/use-cases/write-payroll-deductions)  ·  title: Create an Employee Payroll Run

Guide
├── Reading & Writing Data/
│   ├── Overview   (guides/reading-writing/overview)  ·  title: Reading & Writing Data
│   ├── Querying the data   (guides/reading-writing/querying-data)
│   ├── Data Basics/
│   │   ├── id vs remote_id   (guides/reading-writing/record-identity)  ·  title: Record identity
│   │   └── Enum values   (guides/reading-writing/enum-values)
│   ├── Syncing   (guides/reading-writing/syncing)
│   ├── Raw data   (guides/reading-writing/raw-data)  ·  title: Raw Data
│   ├── Webhooks   (guides/reading-writing/webhooks)  ·  title: Webhook
│   └── Meta APIs   (guides/reading-writing/meta-apis)  ·  title: Meta APIs for write operations
├── Extending the Model/
│   ├── Custom fields   (guides/extending/custom-fields)  ·  title: Custom Fields
│   └── Passthrough   (guides/extending/passthrough)
├── SDK & MCP/
│   ├── Frontend SDK   (guides/sdk/frontend-sdk)
│   └── MCP   (guides/sdk/mcp)
├── Data Models/
│   ├── Employee & org data   (guides/data-models/employee-and-org)  ·  title: Employee & Org Data
│   ├── Payroll   (guides/data-models/payroll)
│   ├── Benefits   (guides/data-models/benefits)
│   ├── Time & attendance   (guides/data-models/time-and-attendance)  ·  title: Time & Attendance
│   ├── Recruiting   (guides/data-models/recruiting)
│   └── Learning   (guides/data-models/learning)  ·  title: LMS models
├── Go Live/
│   └── Checklist   (guides/go-live/checklist)  ·  title: Go-Live Checklist
└── Troubleshooting/
    ├── Errors & issues   (guides/troubleshooting/errors-and-issues)
    ├── Logs   (guides/troubleshooting/logs)
    ├── Monitoring/
    │   ├── Sync status   (guides/troubleshooting/sync-status)  ·  title: Monitor Sync Status
    │   └── Connections to relink   (guides/troubleshooting/connections-to-relink)  ·  title: Connection Needing Relink
    ├── Reconciling Data/
    │   ├── Missing or extra records   (guides/troubleshooting/missing-or-extra-records)  ·  title: Missing or Unexpected Records
    │   ├── Partial syncs   (guides/troubleshooting/partial-syncs)  ·  title: Diagnose a Partial Sync
    │   └── Record counts   (guides/troubleshooting/record-counts)  ·  title: Reconcile Record Counts Against the Source
    └── Permission errors   (guides/troubleshooting/permission-errors)  ·  title: Resolve a Source-System Permission Error

API Reference
├── API Basics/  [book-open]
│   ├── Authentication   (api-reference/basics/authentication)
│   ├── Pagination   (api-reference/basics/pagination)
│   ├── Sync frequency   (api-reference/basics/sync-frequency)  ·  title: Sync Frequency
│   └── Rate limits   (api-reference/basics/rate-limits)  ·  title: Rate Limits
├── Platform/  [boxes]
│   ├── Integrations/
│   │   └── GET /api/hris/v1/integrations   (api-reference/integrations/get-integrations)
│   ├── Embedded Link/
│   │   ├── POST /api/embedded/v1/link/create-link-token   (sdk/create-link-token)
│   │   └── GET /api/embedded/v1/connectors/connector_token/{temporary_token}   (sdk/get-connector-token)
│   ├── Connectors/
│   │   ├── Get Connectors   (api-reference/connectors/get-connectors)  ·  title: GET /api/hris/v1/connectors
│   │   ├── Force Resync a Connector   (api-reference/connectors/resync-connector)  ·  title: POST /api/embedded/v1/connectors/resync
│   │   └── Delete Connector   (api-reference/connectors/delete-connector)  ·  title: DELETE /api/hris/v1/connectors/{connector_id}/delete
│   ├── Custom Fields/
│   │   ├── Lookup/
│   │   │   ├── List Models   (api-reference/custom-fields/list-models)  ·  title: GET /api/v1/lookup/models
│   │   │   └── List Integrations   (api-reference/custom-fields/list-integrations)  ·  title: GET /api/v1/lookup/integrations
│   │   ├── Definitions/
│   │   │   ├── Create Custom Field   (api-reference/custom-fields/create-custom-field)  ·  title: POST /api/v1/custom-fields
│   │   │   ├── List Custom Fields   (api-reference/custom-fields/list-custom-fields)  ·  title: GET /api/v1/custom-fields
│   │   │   ├── Get Custom Field   (api-reference/custom-fields/get-custom-field)  ·  title: GET /api/v1/custom-fields/{custom_field_id}
│   │   │   └── Delete Custom Field   (api-reference/custom-fields/delete-custom-field)  ·  title: DELETE /api/v1/custom-fields/{custom_field_id}
│   │   ├── Mappings/
│   │   │   ├── Create Mapping   (api-reference/custom-fields/create-mapping)  ·  title: POST /api/v1/custom-fields/mapping
│   │   │   ├── List Mappings   (api-reference/custom-fields/list-mappings)  ·  title: GET /api/v1/custom-fields/mapping
│   │   │   ├── Update Mapping   (api-reference/custom-fields/update-mapping)  ·  title: PATCH /api/v1/custom-fields/mapping/{custom_field_mapping_id}
│   │   │   └── Delete Mapping   (api-reference/custom-fields/delete-mapping)  ·  title: DELETE /api/v1/custom-fields/mapping/{custom_field_mapping_id}
│   │   └── Discovery & Validation/
│   │       ├── Get Raw Data   (api-reference/custom-fields/get-raw-data)  ·  title: GET /api/v1/custom-fields/raw-data
│   │       ├── Preview   (api-reference/custom-fields/preview)  ·  title: POST /api/v1/custom-fields/preview
│   │       └── Get Configuration   (api-reference/custom-fields/get-configuration)  ·  title: GET /api/v1/custom-fields/configuration
│   └── Passthrough/
│       └── Make a request   (api-reference/passthrough/make-passthrough-request)  ·  title: POST /api/v1/passthrough
├── HR & Payroll (HRIS)/  [users]
│   ├── Overview   (hris/overview)  ·  title: HR & Payroll (HRIS)
│   ├── Employee Data/  [expanded]
│   │   ├── Employee/
│   │   │   ├── GET /api/hris/v1/employees   (hris/employee/get-employees)
│   │   │   ├── GET /api/hris/v1/employees/{id}   (hris/employee/get-employee-by-id)
│   │   │   ├── GET /api/hris/v1/employees/meta/post   (hris/employee/get-create-employee-meta)
│   │   │   ├── GET /api/hris/v1/employees/create/meta   (hris/employee/get-create-employee-request-body)
│   │   │   └── POST /api/hris/v1/employees   (hris/employee/create-employee)
│   │   ├── Employments/
│   │   │   ├── GET /api/hris/v1/employments   (hris/employments/get-employments)
│   │   │   └── GET /api/hris/v1/employments/{id}   (hris/employments/get-employment-by-id)
│   │   ├── Compensation/
│   │   │   ├── GET /api/hris/v1/compensations   (hris/compensation/get-compensations)
│   │   │   └── GET /api/hris/v1/compensations/{id}   (hris/compensation/get-compensation-by-id)
│   │   ├── Dependents/
│   │   │   ├── GET /api/hris/v1/dependents   (hris/dependents/get-dependents)
│   │   │   └── GET /api/hris/v1/dependents/{id}   (hris/dependents/get-dependent-by-id)
│   │   ├── Bank Info/
│   │   │   ├── GET /api/hris/v1/bank-info   (hris/bank-info/get-bank-info-list)
│   │   │   └── GET /api/hris/v1/bank-info/{id}   (hris/bank-info/get-bank-info-by-id)
│   │   └── Documents/  [BETA]
│   │       ├── GET /api/hris/v1/documents   (hris/documents/get-documents)
│   │       ├── GET /api/hris/v1/documents/{id}   (hris/documents/get-document-by-id)
│   │       └── GET /api/hris/v1/documents/{id}/download   (hris/documents/get-document-download-url)
│   ├── Organization/  [expanded]
│   │   ├── Company/
│   │   │   ├── GET /api/hris/v1/companies   (hris/companies/get-companies)
│   │   │   └── GET /api/hris/v1/companies/{id}   (hris/companies/get-company-by-id)
│   │   ├── Group/
│   │   │   ├── GET /api/hris/v1/groups   (hris/groups/get-groups)
│   │   │   └── GET /api/hris/v1/groups/{id}   (hris/groups/get-group-by-id)
│   │   └── Location/  [BETA]
│   │       ├── GET /api/hris/v1/locations   (hris/locations/get-locations)
│   │       └── GET /api/hris/v1/locations/{id}   (hris/locations/get-location-by-id)
│   ├── Payroll/  [expanded]
│   │   ├── Payroll Runs/
│   │   │   ├── GET /api/hris/v1/payroll-runs   (hris/payroll-runs/get-payroll-runs)
│   │   │   └── GET /api/hris/v1/payroll-runs/{id}   (hris/payroll-runs/get-payroll-run-by-id)
│   │   ├── Employee Payroll Runs/
│   │   │   ├── GET /api/hris/v1/employee-payroll-runs   (hris/employee-payroll-runs/get-employee-payroll-runs)
│   │   │   ├── GET /api/hris/v1/employee-payroll-runs/{id}   (hris/employee-payroll-runs/get-employee-payroll-runs-by-id)
│   │   │   ├── GET /api/hris/v1/employee-payroll-runs/meta/post   (hris/employee-payroll-runs/get-create-employee-payroll-run-meta)
│   │   │   └── POST /api/hris/v1/employee-payroll-runs   (hris/employee-payroll-runs/create-employee-payroll-runs)
│   │   ├── Payroll Run Calendar/
│   │   │   ├── GET /api/hris/v1/payroll-run-calendars   (hris/payroll-run-calendar/get-payroll-run-calendars)
│   │   │   └── GET /api/hris/v1/payroll-run-calendars/{id}   (hris/payroll-run-calendar/get-payroll-run-calendar-by-id)
│   │   ├── Pay Groups/
│   │   │   ├── GET /api/hris/v1/pay-groups   (hris/pay-groups/get-pay-groups)
│   │   │   └── GET /api/hris/v1/pay-groups/{id}   (hris/pay-groups/get-pay-group-by-id)
│   │   └── Payroll Codes/  [BETA]
│   │       ├── GET /api/hris/v1/payroll-codes   (hris/payroll-codes/get-payroll-codes)
│   │       └── GET /api/hris/v1/payroll-codes/{id}   (hris/payroll-codes/get-payroll-code-by-id)
│   ├── Benefits/  [expanded]
│   │   ├── Employee Benefits/
│   │   │   ├── GET /api/hris/v1/benefits   (hris/benefits/get-benefits)
│   │   │   └── GET /api/hris/v1/benefits/{id}   (hris/benefits/get-benefit-by-id)
│   │   ├── Employer Benefits/
│   │   │   ├── GET /api/hris/v1/employer-benefits   (hris/employer-benefits/get-employer-benefits)
│   │   │   └── GET /api/hris/v1/employer-benefits/{id}   (hris/employer-benefits/get-employer-benefit-by-id)
│   │   ├── Dependent Benefits/
│   │   │   ├── GET /api/hris/v1/dependent-benefits   (hris/dependent-benefits/get-dependent-benefits)
│   │   │   └── GET /api/hris/v1/dependent-benefits/{id}   (hris/dependent-benefits/get-dependent-benefit-by-id)
│   │   └── Benefit Coverage/  [BETA]
│   │       ├── GET /api/hris/v1/benefit-coverages   (hris/benefit-coverages/get-benefit-coverages)
│   │       └── GET /api/hris/v1/benefit-coverages/{id}   (hris/benefit-coverages/get-benefit-coverage-by-id)
│   └── Time & Attendance/  [expanded]
│       ├── Time Off/
│       │   ├── GET /api/hris/v1/time-off   (hris/time-off/get-time-off-list)
│       │   ├── GET /api/hris/v1/time-off/{id}   (hris/time-off/get-time-off-by-id)
│       │   ├── GET /api/hris/v1/time-off/meta/post   (hris/time-off/get-create-time-off-meta)
│       │   └── POST /api/hris/v1/time-off   (hris/time-off/create-time-off)
│       ├── Time Off Balance/
│       │   ├── GET /api/hris/v1/time-off-balances   (hris/time-off-balance/get-time-off-balances-list)
│       │   └── GET /api/hris/v1/time-off-balances/{id}   (hris/time-off-balance/get-time-off-balance-by-id)
│       └── Time Sheet Entry/
│           ├── GET /api/hris/v1/timesheet-entry   (hris/timesheet-entries/get-timesheet-entries-list)
│           ├── GET /api/hris/v1/timesheet-entry/{id}   (hris/timesheet-entries/get-timesheet-entries-by-id)
│           ├── GET /api/hris/v1/timesheet-entry/meta/post   (hris/timesheet-entries/get-create-timesheet-meta)
│           └── POST /api/hris/v1/timesheet-entry   (hris/timesheet-entries/create-timesheet-entries)
├── Recruiting (ATS)/  [user-plus]
│   ├── Overview   (ats/overview)  ·  title: Recruiting (ATS)
│   ├── Talent Acquisition/  [expanded]
│   │   ├── Candidate/
│   │   │   ├── GET /api/ats/v1/candidates   (ats/candidate/get-candidates)
│   │   │   ├── GET /api/ats/v1/candidates/{id}   (ats/candidate/get-candidate-by-id)
│   │   │   ├── GET /api/ats/v1/candidates/create/meta   (ats/candidate/meta-create-candidate)
│   │   │   ├── POST /api/ats/v1/candidates   (ats/candidate/create-candidate)
│   │   │   └── POST /api/ats/v1/candidates/{candidate_id}/attachments   (ats/candidate/write-attachment-for-existing-candidate)
│   │   ├── Application/
│   │   │   ├── GET /api/ats/v1/applications   (ats/application/get-applications)
│   │   │   ├── GET /api/ats/v1/applications/{id}   (ats/application/get-application-by-id)
│   │   │   └── POST /api/ats/v1/applications   (ats/application/create-application)
│   │   ├── Job/
│   │   │   ├── GET /api/ats/v1/jobs   (ats/job/get-jobs)
│   │   │   ├── GET /api/ats/v1/jobs/{id}   (ats/job/get-job-by-id)
│   │   │   └── POST /api/ats/v1/jobs   (ats/job/create-job)
│   │   ├── Job Interview Stage/
│   │   │   ├── GET /api/ats/v1/job-interview-stages   (ats/job-interview-stage/get-job-interview-stages)
│   │   │   ├── GET /api/ats/v1/job-interview-stages/{id}   (ats/job-interview-stage/get-job-interview-stage-by-id)
│   │   │   └── POST /api/ats/v1/job-interview-stages   (ats/job-interview-stage/create-job-interview-stage)
│   │   ├── Scheduled Interview/
│   │   │   ├── GET /api/ats/v1/scheduled-interviews   (ats/scheduled-interview/get-scheduled-interviews)
│   │   │   ├── GET /api/ats/v1/scheduled-interviews/{id}   (ats/scheduled-interview/get-scheduled-interview-by-id)
│   │   │   └── POST /api/ats/v1/scheduled-interviews   (ats/scheduled-interview/create-scheduled-interview)
│   │   ├── Screening Question/
│   │   │   ├── GET /api/ats/v1/screening-questions   (ats/screening-question/get-screening-questions)
│   │   │   ├── GET /api/ats/v1/screening-questions/{id}   (ats/screening-question/get-screening-question-by-id)
│   │   │   └── POST /api/ats/v1/screening-questions   (ats/screening-question/create-screening-question)
│   │   └── Offer/
│   │       ├── GET /api/ats/v1/offers   (ats/offer/get-offers)
│   │       ├── GET /api/ats/v1/offers/{id}   (ats/offer/get-offer-by-id)
│   │       └── POST /api/ats/v1/offers   (ats/offer/create-offer)
│   ├── Evaluation/  [expanded]
│   │   ├── Activity/
│   │   │   ├── GET /api/ats/v1/activities   (ats/activity/get-activities)
│   │   │   ├── GET /api/ats/v1/activities/{id}   (ats/activity/get-activity-by-id)
│   │   │   └── POST /api/ats/v1/activities   (ats/activity/create-activity)
│   │   ├── Scorecard/
│   │   │   ├── GET /api/ats/v1/scorecards   (ats/scorecard/get-scorecards)
│   │   │   ├── GET /api/ats/v1/scorecards/{id}   (ats/scorecard/get-scorecard-by-id)
│   │   │   └── POST /api/ats/v1/scorecards   (ats/scorecard/create-scorecard)
│   │   ├── EEOC/
│   │   │   ├── GET /api/ats/v1/eeocs   (ats/eeoc/get-eeocs)
│   │   │   ├── GET /api/ats/v1/eeocs/{id}   (ats/eeoc/get-eeoc-by-id)
│   │   │   └── POST /api/ats/v1/eeocs   (ats/eeoc/create-eeoc)
│   │   ├── Reject Reason/
│   │   │   ├── GET /api/ats/v1/reject-reasons   (ats/reject-reason/get-reject-reasons)
│   │   │   ├── GET /api/ats/v1/reject-reasons/{id}   (ats/reject-reason/get-reject-reason-by-id)
│   │   │   └── POST /api/ats/v1/reject-reasons   (ats/reject-reason/create-reject-reason)
│   │   ├── Attachment/
│   │   │   ├── GET /api/ats/v1/attachments   (ats/attachment/get-attachments)
│   │   │   ├── GET /api/ats/v1/attachments/{id}   (ats/attachment/get-attachment-by-id)
│   │   │   └── POST /api/ats/v1/attachments   (ats/attachment/create-attachment)
│   │   └── Tag/
│   │       ├── GET /api/ats/v1/tags   (ats/tag/get-tags)
│   │       ├── GET /api/ats/v1/tags/{id}   (ats/tag/get-tag-by-id)
│   │       └── POST /api/ats/v1/tags   (ats/tag/create-tag)
│   └── Organization/  [expanded]
│       ├── Department/
│       │   ├── GET /api/ats/v1/departments   (ats/department/get-departments)
│       │   ├── GET /api/ats/v1/departments/{id}   (ats/department/get-department-by-id)
│       │   └── POST /api/ats/v1/departments   (ats/department/create-department)
│       ├── Office/
│       │   ├── GET /api/ats/v1/offices   (ats/office/get-offices)
│       │   ├── GET /api/ats/v1/offices/{id}   (ats/office/get-office-by-id)
│       │   └── POST /api/ats/v1/offices   (ats/office/create-office)
│       └── Remote User/
│           ├── GET /api/ats/v1/remote-users   (ats/remote-user/get-remote-users)
│           ├── GET /api/ats/v1/remote-users/{id}   (ats/remote-user/get-remote-user-by-id)
│           └── POST /api/ats/v1/remote-users   (ats/remote-user/create-remote-user)
└── Learning (LMS)/  [graduation-cap]
    ├── Overview   (lms/overview)  ·  title: Learning (LMS)
    ├── Users/  [expanded]
    │   ├── GET /api/lms/v1/users   (lms/users/get-users)
    │   └── GET /api/lms/v1/users/{id}   (lms/users/get-user-by-id)
    ├── Content/  [expanded]
    │   ├── Courses/
    │   │   ├── GET /api/lms/v1/courses   (lms/courses/get-courses)
    │   │   └── GET /api/lms/v1/courses/{id}   (lms/courses/get-course-by-id)
    │   ├── Contents/
    │   │   ├── GET /api/lms/v1/contents   (lms/contents/get-contents)
    │   │   └── GET /api/lms/v1/contents/{id}   (lms/contents/get-content-by-id)
    │   ├── Skills/
    │   │   ├── GET /api/lms/v1/skills   (lms/skills/get-skills)
    │   │   └── GET /api/lms/v1/skills/{id}   (lms/skills/get-skill-by-id)
    │   └── Categories/
    │       ├── GET /api/lms/v1/categories   (lms/categories/get-categories)
    │       └── GET /api/lms/v1/categories/{id}   (lms/categories/get-category-by-id)
    └── Progress/  [expanded]
        ├── Completions/
        │   ├── GET /api/lms/v1/completions   (lms/completions/get-completions)
        │   └── GET /api/lms/v1/completions/{id}   (lms/completions/get-completion-by-id)
        └── Enrollments/
            ├── GET /api/lms/v1/enrollments   (lms/enrollments/get-enrollments)
            └── GET /api/lms/v1/enrollments/{id}   (lms/enrollments/get-enrollment-by-id)
```

## Not in the navigation

8 `.mdx` files exist but are reachable only by direct URL:

- `parked/auto-enrol-a-new-hire`
- `parked/create-a-candidate`
- `parked/create-a-time-off-request`
- `parked/create-a-timesheet-entry`
- `parked/detect-cobra-qualifying-events`
- `parked/effective-dating`
- `parked/multi-entity`
- `parked/sync-dependents-and-beneficiaries`
