# Series selector live diagnosis

On 2026-08-24, the deployed `Human Vapor` Series detail route at `/series/human-vapor` showed the Season guide state **“No seasons available.”** The newly added Season-and-Episode selector intentionally renders only in the Watch or Download tab when the Series API payload includes at least one season and episode. Therefore it cannot appear for this current Series record until the Admin Bot/Panel saves its Season and Episode records and the public API returns them.

The next repair is to make the empty-Series state clear in the Watch and Download tabs and verify the selector with a real Series record that has published Seasons and Episodes. No mock media or episode data should be created.
