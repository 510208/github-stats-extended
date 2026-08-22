import type { RangeContributionsByRepoFragment } from "./generated/stats.js";
import { graphqlDocument } from "./graphqlDocument.js";

/** max value GitHub allows for `first/maxRepositories` */
const MAX_REPOSITORIES_LIMIT = 100;

interface ReposContributedToQueryVariables {
  login: string;
  maxRepositories: number;
}

interface ReposContributedToQuery {
  user: Record<`range_${number}`, RangeContributionsByRepoFragment> | null;
}

/** A `[from, to]` date range to query, both bounds as ISO 8601 timestamps. */
interface ContributionRange {
  from: string;
  to: string;
}

/**
 * Build a query for the repositories a user contributed to within multiple
 * time ranges, grouped by contribution type. One aliased
 * `contributionsCollection` field per range, so all ranges are fetched in a
 * single request. The shape is only known at runtime.
 *
 * Mirrors the `contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]`
 * filter used by `repositoriesContributedTo` in `stats.graphql` (review
 * contributions are intentionally left out), but `contributionsCollection`'s
 * by-repository fields cap out at 100 results each, so callers need to split
 * a saturated range in two and re-query.
 *
 * @param ranges Ranges to fetch, one `range_<index>` alias each.
 * @returns Document for `createGraphQLFetcher`.
 */
const buildReposContributedToDocument = (ranges: Array<ContributionRange>) => {
  const rangeFields = ranges
    .map(
      ({ from, to }, index) =>
        `range_${index}: contributionsCollection(from: "${from}", to: "${to}") { ...RangeContributionsByRepo }`,
    )
    .join("\n");

  // fragment must match queries/stats.graphql, which generates its type
  return graphqlDocument<
    ReposContributedToQuery,
    ReposContributedToQueryVariables
  >(`
query userReposContributedTo($login: String!, $repoCap: Int!) {
  user(login: $login) {
    ${rangeFields}
  }
}
fragment RangeContributionsByRepo on ContributionsCollection {
  commitContributionsByRepository(maxRepositories: $repoCap) {
    repository {
      nameWithOwner
    }
  }
  issueContributionsByRepository(maxRepositories: $repoCap) {
    repository {
      nameWithOwner
    }
  }
  pullRequestContributionsByRepository(maxRepositories: $repoCap) {
    repository {
      nameWithOwner
    }
  }
  repositoryContributions(first: $repoCap) {
    nodes {
      repository {
        nameWithOwner
      }
    }
  }
}`);
};

export { buildReposContributedToDocument, MAX_REPOSITORIES_LIMIT };
export type { ContributionRange };
