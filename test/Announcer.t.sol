// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ERC5564Announcer.sol";

contract AnnouncerTest is Test {
    ERC5564Announcer ann;

    function setUp() public {
        ann = new ERC5564Announcer();
    }

    function testAnnounce() public {
        ann.announce(1, address(0x1234), hex"02abcd", hex"00");
    }
}
