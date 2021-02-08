# Atlan Collect SDK

**Doc link** - https://docs.google.com/document/d/15hensnwWfZzxKkt6ybdFd6rM9WuzoylO-yYG-kH--KU/edit

## Documentation

Obviously this isn't exhaustive docs. But it should give an idea

- Using yarn workspaces (uses yarn berry (yarn2))
- Independent and highly scalable services
- Easy e2e and unit tests option - using jest
- Uniflow sdk release system following semver
- Contains
  - `@collect/google-sheets`
  - `@collect/auth`
  - `@collect/core`
  - `@collect/store`

## Scaling options

- RabbitMQ for work queue
  - Each work on a formID is pushed to the work queue
  - This way, we will avoid concurrency issues
  - Each update performed as a atomic transaction
    - Implemented in code using Promise.all();
  - Easy scaling to millions of users
- Google Sheets API Info for concurrency
  - Sheets API mentions concurrent updates to the sheet is handled by it
  - It's still a good practice from our side to maintain a work queue, to avoid dirty pages
- More verbose permissions layer
  - Create base permissions
  - Assign roles, as collection of permissions
  - Create scopes, as collection of roles

## Deployments

- We are using a microservices architecture here
- SO, it makes sense to distribute this to a n8s cluster
- This way, each user service can be scaled seperately and the core will always be available

## Architecture

![architecture](https://codimd.s3.shivering-isles.com/demo/uploads/upload_fb2aa60e766dde16d4b03b2f58e67c27.png)

## Notes

- Using microservices arch, as its the best use case here - plug and play and individually scalable.
- AWS specific terms like regions and instances. But we get the gist
- VPC used here so as not to expose individual services endpoints. These can easily be filtered through the permissions layer before granting users access to the required service endpoints.
- We can enable CloudWatch (or any logger) connected with each service instance to keep an easy check on health
