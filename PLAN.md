# AI Civilization Broker - MVP Plan

## Vision

Build a self-organizing AI company that autonomously discovers business opportunities, assigns work between agents, and attempts to maximize revenue through internal coordination.

The core demo is not lead generation.

The core demo is proving that a group of AI agents can organize themselves into a functioning company.

---

# MVP Success Criteria

Within 15 minutes of running:

* Agents discover opportunities
* Agents create proposals
* Agents compete for work
* Agents form temporary teams
* Internal budget changes
* Roles emerge naturally
* Dashboard visualizes evolution

A judge should be able to watch the company evolve in real-time.

---

# MVP Scope

Build only:

* 5 agents
* 1 opportunity source
* 1 internal economy
* 1 dashboard
* 1 execution loop

No real outreach.

No real payments.

No complex integrations.

---

# Agent Types

All agents start identical.

Each agent contains:

* id
* memory
* budget
* reputation
* skill scores

Example:

Agent-1
Budget: 20
Reputation: 0

Skills:

* research
* sales
* operations

Skills improve based on outcomes.

---

# Opportunity Source

Create a dataset of UK businesses.

Example:

```json
[
  {
    "name": "London Dental Clinic",
    "problem": "No online booking"
  },
  {
    "name": "Manchester Plumber",
    "problem": "Poor website"
  },
  {
    "name": "Bristol Gym",
    "problem": "Weak Google reviews"
  }
]
```

The scanner converts these into opportunities.

Example:

"Build booking solution for London Dental Clinic"

Estimated value:
£500

Difficulty:
Medium

---

# Civilization Loop

Runs every 30 seconds.

## Step 1

Scanner publishes opportunities.

---

## Step 2

Agents independently review opportunities.

Each agent decides:

* pursue
* ignore
* recruit others

---

## Step 3

Agents submit bids.

Example:

Agent-2:
"I can solve this for 8 budget points."

Agent-4:
"I need a team."

---

## Step 4

Best proposal wins.

Winning agent receives budget.

---

## Step 5

Execution simulation.

Agent generates:

* strategy
* landing page plan
* sales pitch

Execution receives score.

---

## Step 6

Performance updates.

Success:

* budget increases
* reputation increases

Failure:

* budget decreases

---

## Step 7

Role emergence.

After multiple cycles:

High research score:
Research Lead

High conversion score:
Sales Lead

High decision score:
Strategist

Roles are assigned automatically.

---

# Internal Economy

Initial company budget:

100 credits

Every opportunity:

Reward:
+10 to +50

Failed execution:
-5 to -20

Agents compete for resources.

Agents with more reputation gain influence.

---

# Dashboard

Page 1: Company Overview

Show:

* Total revenue
* Opportunities found
* Active projects
* Budget remaining

---

Page 2: Agent Civilization

Show:

* Agent cards
* Budget
* Reputation
* Current role

---

Page 3: Activity Feed

Examples:

12:01
Agent-3 proposed project

12:02
Agent-1 challenged proposal

12:03
Agent-3 won bid

12:04
Project executed

12:05
Revenue earned

---

# Tech Stack

Frontend:
Next.js

Backend:
Next.js API routes

Database:
Supabase

Agent Memory:
Supabase tables

Agent Execution:
Modal

LLM:
OpenAI API

Realtime:
Supabase Realtime

---

# Database Tables

agents

* id
* name
* reputation
* budget
* role

opportunities

* id
* title
* value
* status

proposals

* id
* agent_id
* opportunity_id
* score

events

* id
* timestamp
* description

---

# Demo Script

Start system live.

Show agents have no roles.

Wait 5 minutes.

Show:

* opportunities discovered
* agents competing
* budgets changing
* leaders emerging

Wait 10 minutes.

Show:

* hierarchy formed
* teams formed
* revenue generated

Final line:

"We didn't build an agent.

We built a company."

---

# Future Versions

V2

* Real UK business discovery
* Real outreach
* PayPal payments
* Autonomous service delivery

V3

* Agent hiring
* Agent firing
* Department creation
* Multi-company competition
* Self-expanding organization
