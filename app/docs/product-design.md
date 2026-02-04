# Product Design Document: Better Weather for Life

## Product Vision

Better Weather for Life empowers outdoor enthusiasts in New Zealand to make confident decisions about when and where to pursue their favourite activities. By intelligently synthesizing weather, tide, and water quality data from multiple trusted sources, the platform eliminates the guesswork and time-consuming research traditionally required to plan outdoor adventures.

The product serves as a decision-making companion that understands the unique requirements of each outdoor activity and presents location rankings tailored to individual needs. Rather than forcing users to interpret raw weather data themselves, the system acts as an expert advisor that has already considered all relevant factors and presents clear, actionable recommendations.

## Product Goals

### Primary Goals

1. Reduce the time users spend researching conditions from hours to seconds by aggregating and analyzing data from multiple sources in real-time

2. Increase user confidence in outdoor activity planning by providing transparent, activity-specific condition assessments with clear reasoning

3. Improve safety outcomes by alerting users to hazardous conditions and explaining why certain locations may be unsuitable

4. Build trust through accuracy by leveraging AI to synthesize complex meteorological and oceanographic data into reliable predictions

### Secondary Goals

1. Grow the active outdoor community in Auckland by making activity planning more accessible to newcomers

2. Create opportunities for local businesses through premium location listings and activity booking integrations

3. Establish the platform as the authoritative source for outdoor activity conditions in New Zealand with potential for expansion to other regions

## Target Users and Personas

### Persona 1: Weekend Warrior Sarah

Sarah is a 34-year-old marketing manager who discovered stand-up paddleboarding during the pandemic. She owns an inflatable SUP and tries to get out on the water every weekend. Living in Ponsonby, she has access to multiple potential launch spots but often wastes time driving to locations only to find conditions are unsuitable.

**Goals**
- Find the best SUP spot within 30 minutes drive for this Saturday morning
- Avoid dangerous offshore winds that could push her away from shore
- Plan around her limited free time on weekends

**Pain Points**
- Currently checks three different apps and websites before making a decision
- Has been caught out by unexpected wind changes mid-paddle
- Uncertain about which tide conditions suit different beaches

**Behaviour Patterns**
- Plans activities on Thursday or Friday evening for the weekend
- Prefers mornings before 10am when waters are typically calmer
- Values safety and will cancel plans if conditions seem marginal

### Persona 2: Retired Explorer Graham

Graham is a 62-year-old recently retired accountant who has taken up sea kayaking. He and his wife Margaret paddle together and are building their skills. They own a tandem kayak and are members of a local paddling club. They have more flexibility with timing but are cautious about safety.

**Goals**
- Discover new kayaking locations along the Auckland coastline
- Find conditions suitable for intermediate-level paddlers
- Plan multi-day trips that require accurate forecasts several days ahead

**Pain Points**
- Struggles to interpret complex weather data and understand what conditions suit kayaking
- Worries about water quality for his wife who has a compromised immune system
- Finds existing weather apps overwhelming with too much irrelevant information

**Behaviour Patterns**
- Often plans midweek outings to avoid weekend crowds
- Prefers longer planning horizons of 3-5 days
- Appreciates detailed explanations of why conditions are rated a certain way

### Persona 3: Fitness-Focused Mike

Mike is a 28-year-old software developer and competitive cyclist who rides 200+ kilometres per week. He participates in local races and trains with a club. His cycling is weather-dependent, and he needs to optimise training around work and Auckland's changeable conditions.

**Goals**
- Identify the best weather windows for long training rides each week
- Find routes with favourable wind conditions
- Avoid dangerous conditions like high winds or heavy rain during descents

**Pain Points**
- Auckland weather changes rapidly and forecasts are often inaccurate for specific locations
- Wind direction affects different routes dramatically
- Needs to coordinate group rides with multiple participants

**Behaviour Patterns**
- Checks conditions multiple times daily
- Plans rides at dawn or dusk around work schedule
- Willing to drive to find better conditions for weekend long rides

### Persona 4: Marine Biology Student Aroha

Aroha is a 22-year-old university student studying marine biology. She goes snorkelling regularly for both study and recreation, often to document marine life at specific sites. She needs detailed water condition information to ensure good visibility and safe conditions for underwater observation.

**Goals**
- Find snorkelling spots with excellent water visibility
- Avoid areas with poor water quality or recent contamination
- Time outings for optimal marine life activity

**Pain Points**
- Water quality warnings are scattered across different council websites
- Visibility conditions are poorly forecast by existing services
- Needs to coordinate field trips with university schedule

**Behaviour Patterns**
- Often makes spontaneous decisions to go snorkelling when conditions look good
- Documents visits with photos and notes
- Values scientific accuracy in condition reporting

## Core Features

### Feature 1: Activity-Specific Location Ranking

The platform's core value proposition is presenting users with a ranked list of locations optimised for their chosen activity. When a user selects an activity type and time window, the system displays locations sorted by suitability, with each location showing an overall score and breakdown of contributing factors.

**User Stories**

As Sarah, I want to see SUP locations ranked by current conditions so that I can quickly identify where to paddle this morning without comparing multiple data sources.

As Graham, I want to filter locations by distance from home so that I can find suitable kayaking spots within my preferred travel radius.

As Mike, I want to view cycling route rankings for different times today so that I can choose the optimal time to start my training ride.

As Aroha, I want to prioritise water visibility in my snorkelling rankings so that I can plan underwater photography sessions.

### Feature 2: Intelligent Condition Analysis

The AI analysis engine processes raw data from multiple sources and translates it into activity-relevant insights. Rather than showing wind speed as a number, it explains what that wind speed means for the specific activity and location.

**User Stories**

As a SUP enthusiast, I want to understand why a location is rated as marginal so that I can make an informed decision about whether to go.

As a beginner kayaker, I want condition assessments calibrated to my skill level so that I do not accidentally paddle in conditions beyond my ability.

As a cyclist, I want to see how wind direction affects my planned route so that I can decide whether to ride the route in reverse.

As a snorkeller, I want to know if recent rainfall has affected water clarity so that I can postpone my trip if visibility will be poor.

### Feature 3: Multi-Day Forecasting

Users need to plan activities in advance, not just for immediate conditions. The forecast feature projects condition suitability forward and highlights the best upcoming opportunities.

**User Stories**

As a weekend paddler, I want to compare Saturday and Sunday conditions at my favourite spots so that I can choose the better day for my activity.

As a kayaking club organiser, I want to see conditions 5 days ahead so that I can schedule group outings with confidence.

As a busy professional, I want to see the best weather windows in the coming week so that I can block time in my calendar for outdoor activities.

As a student, I want notifications when excellent snorkelling conditions are forecast so that I can arrange my study schedule around them.

### Feature 4: Safety Alerts and Warnings

Safety is paramount for water-based and outdoor activities. The system proactively warns users about hazardous conditions and explains the specific risks involved.

**User Stories**

As a SUP paddler, I want to be warned about offshore winds so that I do not get blown away from shore.

As a kayaker, I want to know if dangerous wind-against-tide conditions are expected so that I can avoid choppy waters.

As a cyclist, I want alerts about thunderstorm risk during my planned ride window so that I can reschedule if needed.

As a snorkeller, I want prominent water quality warnings so that I do not swim in contaminated water.

### Feature 5: Personalisation and Learning

The platform learns user preferences over time and tailors recommendations accordingly. Users can also explicitly set preferences for factors like maximum travel distance, skill level, and preferred conditions.

**User Stories**

As a returning user, I want my favourite locations remembered so that I can quickly check conditions at spots I visit regularly.

As a beginner, I want to mark my skill level so that recommendations account for my limited experience.

As someone who prefers early mornings, I want the default view to show morning conditions so that I see relevant information immediately.

As a cautious paddler, I want to set conservative wind thresholds so that recommendations reflect my personal comfort level.

## Data Sources and AI Analysis

### Data Source Overview

The platform aggregates data from four primary sources, each providing complementary information essential for comprehensive condition assessment.

**NIWA Tides**

NIWA's tidal model provides predictions for any point in New Zealand coastal waters with accuracy of 10 centimetres and 5 minutes. The API enables forecasts up to 31 days ahead, covering open coastal areas and major harbours including Waitemata Harbour which serves Auckland's most popular water activity locations.

Key data points include high and low tide times, tidal heights, and tidal flow direction. This information is critical for water activities where tide state affects conditions, accessibility, and safety.

**Windy.app**

Windy.app provides detailed meteorological data from multiple forecast models including ECMWF, GFS, ICON, and their proprietary AI-powered EXP-3 model. The EXP-3 model is particularly valuable as it provides terrain-aware wind predictions that account for how local geography affects wind patterns.

Key data points include wind speed, direction, and gusts at various altitudes; wave height, period, and direction; swell conditions; precipitation type and intensity; temperature and humidity; and cloud cover.

**Safeswim**

Auckland Council's Safeswim programme provides real-time water quality predictions for 163 sites across the Auckland region. The system uses a predictive model incorporating rainfall data, tidal conditions, and historical water quality testing to estimate faecal contamination risk.

Key data points include contamination risk level expressed as low, high, or overflow detected; surf lifeguard patrol status and times; and general swimming safety assessments. This information updates every 15 minutes and has achieved 93% prediction accuracy.

**Google Weather API**

Google's Weather API provides comprehensive atmospheric data enhanced by DeepMind AI models. The API delivers current conditions plus hourly forecasts for up to 240 hours and daily forecasts for 10 days.

Key data points include temperature and feels-like temperature; UV index; visibility; precipitation probability and type; atmospheric pressure; humidity and dewpoint; and sunrise and sunset times.

### AI Analysis Architecture

The AI analysis layer sits between raw data sources and user-facing recommendations. Its role is to synthesize diverse data types into activity-specific assessments that account for how different factors interact and affect each activity type differently.

**Data Aggregation Layer**

The aggregation layer collects data from all sources on a continuous basis, normalising formats and handling source-specific quirks. It maintains a unified data model that associates conditions with specific geographic locations and timestamps.

When data conflicts between sources, the system applies source-specific confidence weightings. For example, NIWA tide data is treated as highly authoritative for tidal predictions, while Windy.app EXP-3 model receives higher weighting for coastal wind patterns due to its terrain-aware design.

**Activity Condition Models**

Each supported activity has a dedicated condition model that defines how raw weather and oceanographic data translates to suitability. These models encode expert knowledge about what constitutes ideal, acceptable, marginal, and unsuitable conditions.

The SUP model prioritises wind speed and direction, tidal state, and water quality. It specifically flags offshore wind conditions as high-risk and favours slack or incoming tides.

The kayaking model shares some factors with SUP but places additional emphasis on wave height and the interaction between wind direction and tidal flow, which can create dangerous choppy conditions.

The snorkelling model prioritises underwater visibility, which correlates with tide state, recent rainfall, and swell conditions. It also heavily weights water quality data given the risk of waterborne illness.

The cycling model focuses on wind speed and direction relative to route orientation, precipitation, temperature, and road surface conditions implied by recent weather.

**Scoring and Ranking Engine**

The scoring engine applies activity condition models to aggregated data for each location in the system. Each location receives a composite score from 0 to 100 representing overall suitability, plus subscores for individual factors.

The ranking algorithm considers not just the overall score but also the presence of any disqualifying conditions. A location with excellent overall conditions but a water quality warning would be ranked below locations without warnings, regardless of score.

**Explanation Generation**

For each recommendation, the AI generates human-readable explanations of why conditions are rated as they are. This transparency builds user trust and helps users learn to interpret conditions themselves over time.

Explanations reference specific data points and explain their implications. For example, rather than simply stating that wind is too strong, the system explains that 18 knot winds with offshore direction could push paddlers away from shore and make returning difficult.

## Activity-Specific Ranking Criteria

### Stand-Up Paddleboarding

**Ideal Conditions (Score 80-100)**
- Wind speed below 13 kilometres per hour
- Wind direction onshore or cross-shore
- Slack tide or incoming tide
- Water quality rated green by Safeswim
- No precipitation
- Air temperature between 18 and 28 degrees Celsius

**Acceptable Conditions (Score 60-79)**
- Wind speed 13 to 20 kilometres per hour
- Any wind direction except directly offshore
- Any tide state
- Water quality rated green
- Light precipitation acceptable
- Air temperature between 15 and 30 degrees Celsius

**Marginal Conditions (Score 40-59)**
- Wind speed 20 to 27 kilometres per hour
- Offshore wind components present
- Strong tidal flow
- Water quality rated green
- Moderate precipitation

**Unsuitable Conditions (Score below 40)**
- Wind speed exceeding 27 kilometres per hour
- Strong offshore winds
- Water quality rated red or black
- Thunderstorm risk
- Extreme temperatures

### Kayaking

**Ideal Conditions (Score 80-100)**
- Wind speed below 9 kilometres per hour
- Minimal wave height below 30 centimetres
- Slack tide
- Water temperature near 21 degrees Celsius
- Air temperature between 18 and 25 degrees Celsius
- No wind-against-tide conditions

**Acceptable Conditions (Score 60-79)**
- Wind speed 9 to 18 kilometres per hour
- Wave height 30 to 60 centimetres
- Any tide state except peak flow
- Water quality rated green
- Light precipitation acceptable

**Marginal Conditions (Score 40-59)**
- Wind speed 18 to 27 kilometres per hour with gusts
- Wave height 60 centimetres to 1 metre
- Strong tidal flow
- Wind direction opposing current
- Moderate precipitation

**Unsuitable Conditions (Score below 40)**
- Wind speed exceeding 27 kilometres per hour
- Wave height exceeding 1 metre
- Severe wind-against-tide choppy conditions
- Water quality warnings
- Thunderstorm risk

### Snorkelling

**Ideal Conditions (Score 80-100)**
- Wind speed below 8 kilometres per hour
- Swell height below 1 metre
- Incoming tide approximately 2 hours before high tide
- Water quality rated green
- Clear skies with good natural light
- No recent significant rainfall affecting visibility

**Acceptable Conditions (Score 60-79)**
- Wind speed 8 to 15 kilometres per hour
- Swell height 1 to 1.5 metres
- High tide or slack tide
- Water quality rated green
- Partly cloudy acceptable
- Minor recent rainfall

**Marginal Conditions (Score 40-59)**
- Wind speed 15 to 22 kilometres per hour
- Swell height 1.5 to 2 metres
- Low tide exposing hazards
- Overcast skies limiting underwater light
- Moderate recent rainfall affecting visibility

**Unsuitable Conditions (Score below 40)**
- Wind speed exceeding 22 kilometres per hour
- Swell height exceeding 2 metres
- Water quality rated red or black
- Heavy recent rainfall with runoff
- Strong currents
- Poor visibility conditions

### Cycling

**Ideal Conditions (Score 80-100)**
- Wind speed below 15 kilometres per hour
- Air temperature between 20 and 25 degrees Celsius
- No precipitation
- Dry road surfaces
- Moderate humidity between 40 and 60 percent
- UV index manageable with standard protection

**Acceptable Conditions (Score 60-79)**
- Wind speed 15 to 25 kilometres per hour
- Air temperature between 15 and 30 degrees Celsius
- Very light precipitation or recent rain with drying roads
- Low humidity or moderate higher humidity

**Marginal Conditions (Score 40-59)**
- Wind speed 25 to 35 kilometres per hour
- Air temperature between 10 and 15 degrees or 30 to 35 degrees Celsius
- Light steady precipitation
- Wet road surfaces
- Strong crosswinds on exposed sections

**Unsuitable Conditions (Score below 40)**
- Wind speed exceeding 35 kilometres per hour or dangerous gusts
- Air temperature below 10 degrees or above 35 degrees Celsius
- Heavy precipitation
- Thunderstorm risk
- Ice risk in winter
- Severely reduced visibility

## Data Flow Architecture

### Data Collection

The platform uses an AI model with tool calling capabilities to collect external data at runtime. Rather than maintaining background polling jobs, the same LLM that generates condition rankings fetches data on-demand when users request location assessments.

**Runtime Data Fetching**

When a user requests activity rankings, the AI model invokes appropriate data collection tools for each required source. This approach eliminates the need for separate data pipeline infrastructure and ensures data freshness aligned with actual user requests.

The AI model is provided with data source endpoints and understands the query parameters needed for each API. Authentication credentials are stored securely in environment variables and referenced in the model's system prompt at runtime, ensuring secrets are never exposed in code or logs.

**Caching Strategy**

To balance API rate limits with data freshness, the platform implements source-specific caching based on each data type's volatility.

NIWA tide data is cached for 24 hours. Tidal predictions are highly stable and rarely change, making extended cache durations appropriate.

Windy.app meteorological data is cached for 30 minutes. Wind conditions can shift rapidly, particularly in coastal areas, so frequent refreshes ensure users receive current predictions.

Safeswim water quality data is cached for 15 minutes, matching the source's update frequency. Contamination risk can escalate quickly following rainfall events, making real-time data critical for user safety.

Google Weather data follows a tiered caching strategy. Current conditions and hourly forecasts are cached for 30 minutes, while daily forecasts are cached for 2 hours given their lower volatility.

**Cache Invalidation**

The cache key incorporates location coordinates, data type, and relevant time parameters. When cached data expires, the next user request triggers a fresh fetch. If an API is temporarily unavailable, the system serves stale cached data with a staleness indicator rather than failing the request entirely.

### Data Processing Pipeline

Raw data flows through a processing pipeline that validates, normalises, and enriches information before storage.

Validation ensures data falls within expected ranges and flags anomalies for investigation. Invalid data points are excluded from analysis until manually reviewed.

Normalisation converts all measurements to consistent units and aligns timestamps to a common reference. Geographic coordinates are standardised and associated with known locations in the system.

Enrichment adds derived values such as apparent temperature accounting for wind chill, tidal flow rate calculated from consecutive tide heights, and visibility estimates based on precipitation and humidity.

### Condition Analysis

When a user requests activity rankings, the AI model performs condition analysis as part of the same request flow. After fetching data from external sources, the model applies activity-specific condition models to generate assessments for each relevant location.

Assessments include the overall suitability score, factor subscores, disqualifying conditions if any, confidence level based on forecast horizon and data freshness, and generated explanation text. The AI model produces natural language explanations alongside numerical scores, helping users understand why conditions are rated as they are.

Completed assessments are cached alongside the underlying data, allowing subsequent requests for the same location and time window to return quickly without reprocessing. Historical assessments are retained for model evaluation and accuracy analysis. Comparing predicted conditions to actual conditions reported by users enables continuous prompt refinement and model improvement.

### User Request Handling

When a user requests rankings, the system first checks the cache for valid assessments matching the specified activity, time window, and geographic area. If cached data exists and remains fresh, results are returned immediately.

For cache misses or expired data, the AI model orchestrates the full request flow: fetching external data, processing it through the validation and enrichment pipeline, performing condition analysis, and generating ranked results. Results are filtered by user preferences such as maximum distance and minimum score threshold before presentation.

Response times depend on cache state. Cached requests return within milliseconds, while fresh data fetches may take several seconds as external APIs are queried. The user interface provides appropriate loading states and can display stale cached data with a refresh indicator while fresh data loads in the background.

## Key User Journeys

### Journey 1: Saturday Morning SUP Session

Sarah opens the app on Friday evening to plan her Saturday morning paddle. She selects Stand-Up Paddleboarding as her activity and Saturday 7am to 10am as her time window.

The home screen displays a ranked list of SUP locations within her default 30-minute travel radius. Each location shows an overall score, key condition factors, and a brief explanation. She sees that Mission Bay rates 85 with excellent conditions expected, while her usual spot at Takapuna rates only 62 due to forecast offshore winds.

Curious about the difference, Sarah taps Mission Bay to view the detailed breakdown. She sees that winds will be light at 8 kilometres per hour from the northeast, creating a gentle onshore breeze. The tide will be incoming and roughly mid-height, providing good water depth without strong currents. Water quality is rated green.

She taps Takapuna to understand why it scored lower. The detail view explains that while overall conditions are acceptable, the forecast southwest wind will be offshore at this beach, creating risk of being blown away from shore. The system recommends Mission Bay as a safer choice given similar overall conditions.

Sarah saves Mission Bay as her plan for Saturday. The app confirms and offers to send a morning notification with updated conditions.

On Saturday morning, Sarah receives a notification confirming Mission Bay remains her best option with conditions tracking as forecast. She has a successful paddle and later marks the trip as completed in the app, with an optional rating of how accurate the conditions assessment was.

### Journey 2: Planning a Club Kayaking Trip

Graham is organising a kayaking trip for his club, targeting a day next week. He opens the app and selects Kayaking, then chooses the 7-Day Forecast to see conditions across all seven upcoming days.

The 7-Day Forecast shows a calendar with condition summaries for each day. Monday through Wednesday show marginal scores due to a forecast weather system bringing wind and rain. Thursday and Friday show excellent conditions as high pressure builds.

Graham taps Thursday to examine conditions in detail. He sees multiple locations rated above 80, with Wenderholm Regional Park scoring highest at 88. The detail view shows calm winds, neap tide with gentle currents, and warm temperatures.

He explores alternative locations to find variety for the club. The app suggests Maraetai as another excellent option with similarly high scores. Graham compares the two locations side by side, noting Wenderholm has slightly calmer water while Maraetai offers more interesting coastal scenery.

Graham shares the Thursday forecast summary to the club's group chat directly from the app. The shared link opens a view showing both locations with full condition details.

As Thursday approaches, Graham receives updates as conditions are refined. The day before, he receives confirmation that conditions remain excellent. The trip proceeds successfully.

### Journey 3: Spontaneous Snorkelling Decision

Aroha wakes up on a summer morning and notices clear blue skies. She wonders if conditions are good for snorkelling and opens the app.

The home screen immediately shows current conditions at her saved favourite locations. Goat Island, her preferred snorkelling spot, shows a score of 91 with a badge indicating Prime Conditions. She taps for details.

The analysis shows ideal conditions converging this morning. The tide is incoming and two hours from high, which correlates with peak visibility. There has been no significant rainfall in the past week, so water clarity should be excellent. Winds are calm and will remain so until afternoon. Water quality is rated green.

The app highlights that conditions will decline after noon as sea breeze develops. Aroha sees this morning as the optimal window.

She quickly checks tide times and sees high tide at 10:30am. The app recommends arriving by 8:30am to maximise the best visibility window. Aroha adjusts her morning plans and heads to Goat Island.

### Journey 4: Cycling Training Optimisation

Mike needs to fit a long training ride into a busy week. He opens the app on Monday and selects Cycling, then the Weekly Planner view.

The planner shows weather windows across the week overlaid with his connected calendar availability. The app identifies three optimal windows: Tuesday early morning, Thursday late afternoon, and Saturday morning.

Mike taps Tuesday morning to examine conditions. Winds will be light from the west. For his preferred Tamaki Drive loop, this means a headwind on the outward leg and tailwind returning, which is ideal for training. Temperature will be 18 degrees at 6am, rising to 22 degrees by 9am. No precipitation is forecast.

He compares this to Saturday morning, which shows stronger winds creating challenging crosswind conditions on exposed sections. The app notes that while Saturday is suitable, Tuesday offers better conditions for a quality training session.

Mike schedules his long ride for Tuesday and sets a pre-dawn alarm. The app creates a calendar event and schedules a notification for 5am with final conditions confirmation.

On Tuesday morning, Mike receives the notification confirming excellent conditions. After his ride, he logs completion and notes that conditions were as predicted, contributing feedback data that improves future predictions.

## Success Metrics

### User Engagement Metrics

**Weekly Active Users**

Target: 10,000 weekly active users within 12 months of launch in Auckland market

This metric indicates the platform is providing sufficient value to drive regular return visits. Weekly measurement aligns with the planning cadence of most outdoor activities.

**Session Frequency**

Target: Average 2.5 sessions per active user per week

Higher session frequency indicates users are checking conditions regularly and finding the information valuable. This metric also suggests the platform is becoming part of users' activity planning routine.

**Feature Adoption**

Target: 60% of users utilise activity-specific rankings within first month

This metric ensures users discover and engage with the core differentiating feature rather than treating the app as a simple weather checker.

### User Satisfaction Metrics

**Condition Accuracy Rating**

Target: 85% of user ratings indicate conditions matched predictions

Users can rate how accurate predictions were after completing activities. This direct feedback validates the AI analysis models and identifies areas for improvement.

**Net Promoter Score**

Target: NPS of 50 or higher

NPS indicates users are satisfied enough to recommend the platform to fellow outdoor enthusiasts. Word-of-mouth recommendation is critical for growth in niche activity communities.

**Time to Decision**

Target: Average under 2 minutes from app open to location selection

This metric validates the core value proposition of reducing research time. If users spend excessive time in the app before deciding, it suggests the rankings and explanations need improvement.

### Safety Metrics

**Warning Heeded Rate**

Target: 90% of users shown safety warnings modify plans or acknowledge understanding

This metric ensures safety warnings are sufficiently prominent and persuasive. Low heeding rates suggest warnings need redesign or the threshold for showing warnings needs adjustment.

**Incident Reports**

Target: Zero serious safety incidents attributed to inaccurate predictions

While incidents can occur despite accurate information, any incident traced to prediction failure requires immediate investigation and model improvement.

### Business Metrics

**User Acquisition Cost**

Target: Under 15 New Zealand dollars per acquired active user

Efficient user acquisition enables sustainable growth. Outdoor community partnerships and word-of-mouth should reduce reliance on paid acquisition.

**Retention Rate**

Target: 40% of new users remain active after 3 months

Retention validates ongoing value delivery. Seasonal variation is expected, with higher retention during summer months.

**Premium Conversion**

Target: 8% conversion to premium subscription within 6 months

Premium features such as extended forecasts, multiple location monitoring, and API access provide revenue while free tier drives adoption.

## Future Considerations

### Geographic Expansion

The initial Auckland focus enables deep integration with local data sources and community building. Future expansion should prioritise regions with strong outdoor activity cultures and available data sources.

Wellington presents a natural second market given the NIWA tide model covers Wellington Harbour. South Island regions with strong cycling and kayaking communities offer growth potential.

International expansion would require partnerships with equivalent local data providers. Australia's Bureau of Meteorology and state-level water quality monitoring programmes could enable trans-Tasman expansion.

### Activity Expansion

Additional activities should be added based on user demand and data applicability. Surfing is a natural extension given existing wave data. Hiking and trail running could leverage weather data with additional trail condition sources.

Each new activity requires development of appropriate condition models and validation with experienced practitioners in that activity.

### Social Features

Community features could enhance engagement and provide additional value. Activity logging with optional sharing creates a record of outdoor adventures. Local spot guides contributed by experienced users could supplement official location data.

Group coordination features would address the common need to align multiple people's availability with suitable conditions. Integration with activity clubs and groups could drive adoption.

### Hardware Integration

Wearable device integration could enhance the experience for users who train with GPS watches or cycling computers. Automatic activity detection could prompt condition logging without manual entry.

Weather station integration in key locations could provide hyperlocal conditions data, improving prediction accuracy for specific launch sites or route segments.
