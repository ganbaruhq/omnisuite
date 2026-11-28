import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Page,
  PageHeader,
  PageHeading,
  PageTitle,
  PageDescription,
  PageActions,
  PageBody,
  PageSection,
  PageSectionTitle,
  PageAside,
  PageFullBleed,
} from "@omnisuite/ui/components/page";
import { Button } from "@omnisuite/ui/components/button";

const meta = {
  title: "React/Components/Page",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <Page>
      <PageHeader>
        <PageHeading>
          <PageTitle>Collections</PageTitle>
          <PageDescription>Organize your workspace.</PageDescription>
        </PageHeading>
        <PageActions>
          <Button>New collection</Button>
        </PageActions>
      </PageHeader>
      <PageBody>
        <PageSection>
          <PageSectionTitle>Recent</PageSectionTitle>
          <p>Design system</p>
        </PageSection>
      </PageBody>
    </Page>
  ),
};
export const WithAside: Story = {
  render: () => (
    <Page>
      <PageHeader>
        <PageHeading>
          <PageTitle>Collections</PageTitle>
          <PageDescription>Organize your workspace.</PageDescription>
        </PageHeading>
        <PageActions>
          <Button>New collection</Button>
        </PageActions>
      </PageHeader>
      <PageBody>
        <PageSection>
          <PageSectionTitle>Recent</PageSectionTitle>
          <p>Design system</p>
        </PageSection>
        <PageAside>24 components ready to use.</PageAside>
      </PageBody>
    </Page>
  ),
};
export const FullBleed: Story = {
  render: () => (
    <Page>
      <PageHeader>
        <PageHeading>
          <PageTitle>Collections</PageTitle>
          <PageDescription>Organize your workspace.</PageDescription>
        </PageHeading>
        <PageActions>
          <Button>New collection</Button>
        </PageActions>
      </PageHeader>
      <PageBody>
        <PageSection>
          <PageSectionTitle>Recent</PageSectionTitle>
          <p>Design system</p>
        </PageSection>
      </PageBody>
      <PageFullBleed className="border-y p-6">Full width activity</PageFullBleed>
    </Page>
  ),
};
