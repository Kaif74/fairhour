CREATE TYPE "DeclaredExperienceLevel" AS ENUM ('beginner', 'intermediate', 'expert');

CREATE TYPE "SkillProofType" AS ENUM ('certificate', 'portfolio', 'link', 'image');

CREATE TYPE "ProofVoteType" AS ENUM ('valid', 'irrelevant', 'fake');

CREATE TYPE "CredibilityEventType" AS ENUM ('job_completed', 'review_added', 'dispute', 'proof_added');

CREATE TABLE "user_skill_experience" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "declared_level" "DeclaredExperienceLevel" NOT NULL DEFAULT 'beginner',
    "experience_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jobs_completed" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "repeat_clients" INTEGER NOT NULL DEFAULT 0,
    "dispute_count" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skill_experience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_skill_proofs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "proof_type" "SkillProofType" NOT NULL,
    "proof_url" TEXT NOT NULL,
    "description" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skill_proofs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proof_votes" (
    "id" TEXT NOT NULL,
    "proof_id" TEXT NOT NULL,
    "voter_id" TEXT NOT NULL,
    "vote_type" "ProofVoteType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proof_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credibility_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "event_type" "CredibilityEventType" NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credibility_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_skill_experience_user_id_occupation_id_key"
    ON "user_skill_experience"("user_id", "occupation_id");

CREATE UNIQUE INDEX "proof_votes_proof_id_voter_id_key"
    ON "proof_votes"("proof_id", "voter_id");

CREATE INDEX "user_skill_experience_user_id_idx"
    ON "user_skill_experience"("user_id");

CREATE INDEX "user_skill_experience_occupation_id_idx"
    ON "user_skill_experience"("occupation_id");

CREATE INDEX "user_skill_proofs_user_id_idx"
    ON "user_skill_proofs"("user_id");

CREATE INDEX "user_skill_proofs_occupation_id_idx"
    ON "user_skill_proofs"("occupation_id");

CREATE INDEX "user_skill_proofs_is_verified_idx"
    ON "user_skill_proofs"("is_verified");

CREATE INDEX "proof_votes_proof_id_idx"
    ON "proof_votes"("proof_id");

CREATE INDEX "proof_votes_voter_id_idx"
    ON "proof_votes"("voter_id");

CREATE INDEX "credibility_events_user_id_idx"
    ON "credibility_events"("user_id");

CREATE INDEX "credibility_events_occupation_id_idx"
    ON "credibility_events"("occupation_id");

CREATE INDEX "credibility_events_event_type_idx"
    ON "credibility_events"("event_type");

ALTER TABLE "user_skill_experience"
    ADD CONSTRAINT "user_skill_experience_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_skill_experience"
    ADD CONSTRAINT "user_skill_experience_occupation_id_fkey"
    FOREIGN KEY ("occupation_id") REFERENCES "Occupation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_skill_proofs"
    ADD CONSTRAINT "user_skill_proofs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_skill_proofs"
    ADD CONSTRAINT "user_skill_proofs_occupation_id_fkey"
    FOREIGN KEY ("occupation_id") REFERENCES "Occupation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "proof_votes"
    ADD CONSTRAINT "proof_votes_proof_id_fkey"
    FOREIGN KEY ("proof_id") REFERENCES "user_skill_proofs"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "proof_votes"
    ADD CONSTRAINT "proof_votes_voter_id_fkey"
    FOREIGN KEY ("voter_id") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credibility_events"
    ADD CONSTRAINT "credibility_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credibility_events"
    ADD CONSTRAINT "credibility_events_occupation_id_fkey"
    FOREIGN KEY ("occupation_id") REFERENCES "Occupation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
