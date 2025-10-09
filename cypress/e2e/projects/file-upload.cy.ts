describe("Project File Upload", () => {
  const appUrl = Cypress.env("APP_URL") as string;
  let projectId: string;

  before(() => {
    // Login first
    cy.visit(`${appUrl}/auth/login`);
    cy.get('input[type="email"]').type("hello@pierrecabriere.fr");
    cy.get('input[type="password"]').type("test123");
    cy.get('button[type="submit"]').click();
    cy.url().should("not.include", "/auth/login");

    // Create a test project
    cy.visit(`${appUrl}/projects/new`);
    cy.get('input[name="name"]').type("Test Upload Project");
    cy.get('textarea[name="description"]').type("Project for testing file uploads");
    cy.get('button[type="submit"]').click();
    
    // Get project ID from URL
    cy.url().should("include", "/projects/");
    cy.url().then((url) => {
      projectId = url.split("/projects/")[1].split("/")[0];
    });
  });

  beforeEach(() => {
    cy.visit(`${appUrl}/projects/${projectId}`);
  });

  it("should display file upload button", () => {
    cy.contains("button", /upload files/i).should("exist");
  });

  it("should open file upload dialog", () => {
    cy.contains("button", /upload files/i).click();
    cy.get('[role="dialog"]').should("exist");
    cy.contains("Upload Files").should("exist");
  });

  it("should upload a single audio file", () => {
    cy.contains("button", /upload files/i).click();
    
    // Wait for dialog
    cy.get('[role="dialog"]').should("be.visible");
    
    // Select file input
    cy.get('input[type="file"]').selectFile({
      contents: "cypress/fixtures/test-audio.mp3",
      fileName: "test-audio.mp3",
      mimeType: "audio/mpeg",
    }, { force: true });

    // Check file is selected
    cy.contains("test-audio.mp3").should("exist");

    // Submit upload
    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", /upload/i).click();
    });

    // Check for upload progress indicator
    cy.get('[role="progressbar"], .animate-spin').should("exist");

    // Wait for success
    cy.contains(/upload.*success/i, { timeout: 10000 }).should("exist");

    // Verify file appears in project
    cy.get('[role="dialog"]').should("not.exist");
    cy.contains("test-audio.mp3").should("exist");
  });

  it("should show upload progress", () => {
    cy.contains("button", /upload files/i).click();
    
    cy.get('input[type="file"]').selectFile({
      contents: "cypress/fixtures/test-audio.mp3",
      fileName: "progress-test.mp3",
      mimeType: "audio/mpeg",
    }, { force: true });

    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", /upload/i).click();
    });

    // Check for progress indicators
    cy.get('[role="progressbar"], [data-progress], .animate-pulse').should("exist");
  });

  it("should upload multiple files", () => {
    cy.contains("button", /upload files/i).click();
    
    // Upload multiple files
    cy.get('input[type="file"]').selectFile([
      {
        contents: "cypress/fixtures/test-audio.mp3",
        fileName: "track-1.mp3",
        mimeType: "audio/mpeg",
      },
      {
        contents: "cypress/fixtures/test-audio.mp3",
        fileName: "track-2.mp3",
        mimeType: "audio/mpeg",
      },
    ], { force: true });

    // Check both files are listed
    cy.contains("track-1.mp3").should("exist");
    cy.contains("track-2.mp3").should("exist");

    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", /upload/i).click();
    });

    // Wait for both files to upload
    cy.contains(/upload.*success/i, { timeout: 15000 }).should("exist");
  });

  it("should handle upload errors gracefully", () => {
    cy.contains("button", /upload files/i).click();
    
    // Try uploading invalid file type
    cy.get('input[type="file"]').selectFile({
      contents: "cypress/fixtures/example.json",
      fileName: "invalid.json",
      mimeType: "application/json",
    }, { force: true });

    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", /upload/i).click();
    });

    // Should show error message
    cy.contains(/error|failed|invalid/i).should("exist");
  });

  it("should allow canceling upload", () => {
    cy.contains("button", /upload files/i).click();
    
    cy.get('input[type="file"]').selectFile({
      contents: "cypress/fixtures/test-audio.mp3",
      fileName: "cancel-test.mp3",
      mimeType: "audio/mpeg",
    }, { force: true });

    // Cancel dialog
    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", /cancel/i).click();
    });

    // Dialog should close
    cy.get('[role="dialog"]').should("not.exist");
  });

  after(() => {
    // Cleanup: Delete test project if needed
    // This would require implementing delete functionality
  });
});

